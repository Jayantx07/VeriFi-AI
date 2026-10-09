from typing import List, Dict, Any, Optional

try:
    from neo4j import GraphDatabase, Driver
    HAS_NEO4J_DRIVER = True
except ImportError:
    GraphDatabase = None
    Driver = Any
    HAS_NEO4J_DRIVER = False

from app.config import settings

class Neo4jConnector:
    def __init__(self):
        self.driver: Optional[Driver] = None
        self.is_connected = False
        self._init_driver()

        # In-memory graph fallback store for seamless offline/standalone operation
        self.mock_nodes: Dict[str, Dict[str, Any]] = {}
        self.mock_edges: List[Dict[str, Any]] = []

    def _init_driver(self):
        if not HAS_NEO4J_DRIVER:
            print("[INFO] neo4j package not found. Running with high-performance in-memory graph engine.")
            self.is_connected = False
            self.driver = None
            return

        try:
            self.driver = GraphDatabase.driver(
                settings.NEO4J_URI,
                auth=(settings.NEO4J_USER, settings.NEO4J_PASSWORD),
                max_connection_lifetime=3600
            )
            # Verify connectivity
            self.driver.verify_connectivity()
            self.is_connected = True
            print("[INFO] Connected successfully to Neo4j database.")
        except Exception as e:
            print(f"[WARN] Could not connect to Neo4j ({e}). Running with in-memory graph engine.")
            self.is_connected = False
            self.driver = None

    def close(self):
        if self.driver:
            self.driver.close()

    def run_query(self, query: str, parameters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """
        Executes a Cypher query against Neo4j, falling back to mock graph engine if disconnected.
        """
        if self.is_connected and self.driver:
            try:
                with self.driver.session(database=settings.NEO4J_DATABASE) as session:
                    result = session.run(query, parameters or {})
                    return [record.data() for record in result]
            except Exception as e:
                print(f"[WARN] Error executing Cypher query on Neo4j: {e}. Falling back to in-memory graph.")

        # In-memory mock fallback handles node insertion and edge tracking
        return self._run_mock_fallback(query, parameters or {})

    def _run_mock_fallback(self, query: str, parameters: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Handles node creation and temporal lookups when Neo4j service is offline.
        """
        q = query.strip()
        # Handle User Node
        if "MERGE (u:User" in q:
            email = parameters.get("email")
            if email:
                node_id = f"User_{email}"
                self.mock_nodes[node_id] = {
                    "id": node_id,
                    "type": "User",
                    "label": email,
                    "email": email,
                    "properties": parameters
                }
            return [{"created": True}]

        # Handle Email Node
        if "CREATE (e:Email" in q:
            event_id = parameters.get("event_id")
            node_id = f"Email_{event_id}"
            self.mock_nodes[node_id] = {
                "id": node_id,
                "type": "Email",
                "label": f"Email: {parameters.get('subject', 'Suspicious Email')}",
                "risk": parameters.get("risk_score", 0.0),
                "properties": parameters
            }
            # Link to User
            recipient = parameters.get("recipient")
            if recipient:
                user_id = f"User_{recipient}"
                if user_id not in self.mock_nodes:
                    self.mock_nodes[user_id] = {
                        "id": user_id,
                        "type": "User",
                        "label": recipient,
                        "email": recipient,
                        "properties": {}
                    }
                self.mock_edges.append({
                    "source": node_id,
                    "target": user_id,
                    "relationship": "SENT_TO",
                    "properties": {"timestamp": parameters.get("timestamp")}
                })
            return [{"node_id": node_id}]

        # Handle Call Node
        if "CREATE (c:Call" in q:
            event_id = parameters.get("event_id")
            node_id = f"Call_{event_id}"
            self.mock_nodes[node_id] = {
                "id": node_id,
                "type": "Call",
                "label": f"Call: {parameters.get('caller', 'Caller')}",
                "risk": round(parameters.get("deepfake_score", 0.0) * 100, 1),
                "properties": parameters
            }
            target = parameters.get("target")
            if target:
                user_id = f"User_{target}"
                if user_id not in self.mock_nodes:
                    self.mock_nodes[user_id] = {
                        "id": user_id,
                        "type": "User",
                        "label": target,
                        "email": target,
                        "properties": {}
                    }
                self.mock_edges.append({
                    "source": node_id,
                    "target": user_id,
                    "relationship": "CALLED",
                    "properties": {"timestamp": parameters.get("timestamp")}
                })
            return [{"node_id": node_id}]

        # Handle Payment Node
        if "CREATE (p:Payment" in q:
            tx_id = parameters.get("transaction_id")
            node_id = f"Payment_{tx_id}"
            self.mock_nodes[node_id] = {
                "id": node_id,
                "type": "Payment",
                "label": f"Payment: ${parameters.get('amount', 0):,.2f} ({parameters.get('beneficiary_name', 'Beneficiary')})",
                "risk": parameters.get("risk_score", 0.0),
                "properties": parameters
            }
            requester = parameters.get("requester_email")
            if requester:
                user_id = f"User_{requester}"
                self.mock_edges.append({
                    "source": user_id,
                    "target": node_id,
                    "relationship": "INITIATED",
                    "properties": {"timestamp": parameters.get("timestamp")}
                })
            return [{"node_id": node_id}]

        return []

neo4j_connector = Neo4jConnector()
