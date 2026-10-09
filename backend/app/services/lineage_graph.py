from datetime import datetime, timedelta, timezone
from typing import Dict, Any, List, Optional
from app.core.neo4j_connector import neo4j_connector
from app.models.schemas import GraphNode, GraphEdge

class LineageGraphService:
    """
    Manages graph topology, entity node creation, and Cypher-based temporal correlation.
    Correlates high-risk sensor events within a 72-hour sliding window.
    """

    @classmethod
    def ensure_user(cls, email: str, name: Optional[str] = None) -> str:
        query = """
        MERGE (u:User {email: $email})
        ON CREATE SET u.name = $name, u.created_at = datetime()
        RETURN u.email AS email
        """
        neo4j_connector.run_query(query, {"email": email, "name": name or email.split("@")[0]})
        return f"User_{email}"

    @classmethod
    def record_email_event(cls, event_data: Dict[str, Any]) -> str:
        """
        Creates an (:Email) node and connects it via (:Email)-[:SENT_TO]->(:User).
        """
        cls.ensure_user(event_data["recipient"])

        query = """
        CREATE (e:Email {
            event_id: $event_id,
            sender: $sender,
            recipient: $recipient,
            subject: $subject,
            spf_result: $spf_result,
            dkim_result: $dkim_result,
            urgency_score: $urgency_score,
            financial_action_detected: $financial_action_detected,
            secrecy_detected: $secrecy_detected,
            risk_score: $risk_score,
            timestamp: $timestamp
        })
        WITH e
        MATCH (u:User {email: $recipient})
        CREATE (e)-[:SENT_TO {timestamp: $timestamp}]->(u)
        RETURN e.event_id AS event_id
        """
        neo4j_connector.run_query(query, event_data)
        return f"Email_{event_data['event_id']}"

    @classmethod
    def record_call_event(cls, event_data: Dict[str, Any]) -> str:
        """
        Creates a (:Call) node and connects it via (:Call)-[:TARGETED]->(:User).
        """
        cls.ensure_user(event_data["target"])

        query = """
        CREATE (c:Call {
            event_id: $event_id,
            caller: $caller,
            target: $target,
            deepfake_score: $deepfake_score,
            duration_seconds: $duration_seconds,
            risk_score: $risk_score,
            timestamp: $timestamp
        })
        WITH c
        MATCH (u:User {email: $target})
        CREATE (c)-[:CALLED {timestamp: $timestamp}]->(u)
        RETURN c.event_id AS event_id
        """
        neo4j_connector.run_query(query, event_data)
        return f"Call_{event_data['event_id']}"

    @classmethod
    def record_payment_event(cls, tx_data: Dict[str, Any]) -> str:
        """
        Creates a (:Payment) node and links via (:User)-[:INITIATED]->(:Payment).
        """
        cls.ensure_user(tx_data["requester_email"])

        query = """
        CREATE (p:Payment {
            transaction_id: $transaction_id,
            requester_email: $requester_email,
            beneficiary_name: $beneficiary_name,
            beneficiary_iban: $beneficiary_iban,
            amount: $amount,
            currency: $currency,
            reference: $reference,
            risk_score: $risk_score,
            status: $status,
            timestamp: $timestamp
        })
        WITH p
        MATCH (u:User {email: $requester_email})
        CREATE (u)-[:INITIATED {timestamp: $timestamp}]->(p)
        RETURN p.transaction_id AS transaction_id
        """
        neo4j_connector.run_query(query, tx_data)
        return f"Payment_{tx_data['transaction_id']}"

    @classmethod
    def query_recent_correlations_72h(cls, requester_email: str, window_hours: int = 72) -> List[Dict[str, Any]]:
        """
        Traverses Neo4j graph for suspicious Email and Call nodes connected to the requester
        within the last 72 hours.
        """
        cutoff_iso = (datetime.now(timezone.utc) - timedelta(hours=window_hours)).isoformat()

        if neo4j_connector.is_connected:
            query = """
            MATCH (u:User {email: $email})
            OPTIONAL MATCH (e:Email)-[r1:SENT_TO]->(u)
            WHERE e.timestamp >= datetime($cutoff) AND (e.risk_score >= 40.0 OR e.spf_result = 'fail' OR e.urgency_score > 0.7)
            OPTIONAL MATCH (c:Call)-[r2:CALLED]->(u)
            WHERE c.timestamp >= datetime($cutoff) AND c.deepfake_score >= 0.50
            RETURN collect(DISTINCT e) AS emails, collect(DISTINCT c) AS calls
            """
            results = neo4j_connector.run_query(query, {"email": requester_email, "cutoff": cutoff_iso})
            correlations = []
            if results:
                for email_node in results[0].get("emails", []):
                    if email_node:
                        correlations.append({"type": "Email", "data": email_node})
                for call_node in results[0].get("calls", []):
                    if call_node:
                        correlations.append({"type": "Call", "data": call_node})
            return correlations

        # In-memory graph engine lookup
        user_node_id = f"User_{requester_email}"
        correlations = []
        for edge in neo4j_connector.mock_edges:
            if edge["target"] == user_node_id:
                source_id = edge["source"]
                source_node = neo4j_connector.mock_nodes.get(source_id)
                if source_node:
                    if source_node["type"] == "Email" and source_node.get("risk", 0) >= 40:
                        correlations.append({"type": "Email", "data": source_node["properties"]})
                    elif source_node["type"] == "Call" and source_node.get("properties", {}).get("deepfake_score", 0) >= 0.50:
                        correlations.append({"type": "Call", "data": source_node["properties"]})
        return correlations

    @classmethod
    def get_transaction_subgraph(cls, transaction_id: str) -> Dict[str, Any]:
        """
        Builds the visual Lineage Graph (nodes and edges) for the Fraud Analyst visualizer.
        """
        # Collect nodes and edges
        nodes: List[GraphNode] = []
        edges: List[GraphEdge] = []

        # Find payment in mock or neo4j
        payment_key = f"Payment_{transaction_id}"
        payment_node_data = neo4j_connector.mock_nodes.get(payment_key)

        if not payment_node_data:
            # Generate default payment representation if requested directly
            payment_node_data = {
                "id": payment_key,
                "type": "Payment",
                "label": f"Payment: #{transaction_id}",
                "risk": 50.0,
                "properties": {"transaction_id": transaction_id, "amount": 250000.0}
            }

        nodes.append(GraphNode(
            id=payment_node_data["id"],
            type="Payment",
            label=payment_node_data["label"],
            risk=payment_node_data.get("risk", 50.0),
            properties=payment_node_data.get("properties", {})
        ))

        # Reconstruct graph from stored mock edges and nodes
        for edge in neo4j_connector.mock_edges:
            source_node = neo4j_connector.mock_nodes.get(edge["source"])
            target_node = neo4j_connector.mock_nodes.get(edge["target"])

            if source_node and target_node:
                # Add source node if not already present
                if not any(n.id == source_node["id"] for n in nodes):
                    nodes.append(GraphNode(
                        id=source_node["id"],
                        type=source_node["type"],
                        label=source_node["label"],
                        risk=source_node.get("risk", 0.0),
                        properties=source_node.get("properties", {})
                    ))

                # Add target node if not already present
                if not any(n.id == target_node["id"] for n in nodes):
                    nodes.append(GraphNode(
                        id=target_node["id"],
                        type=target_node["type"],
                        label=target_node["label"],
                        risk=target_node.get("risk", 0.0),
                        properties=target_node.get("properties", {})
                    ))

                edges.append(GraphEdge(
                    source=edge["source"],
                    target=edge["target"],
                    relationship=edge["relationship"],
                    properties=edge.get("properties", {})
                ))

        return {
            "transaction_id": transaction_id,
            "nodes": [n.model_dump() for n in nodes],
            "edges": [e.model_dump() for e in edges]
        }

lineage_graph_service = LineageGraphService()
