param([string]$In, [string]$Out)
$ppt = New-Object -ComObject PowerPoint.Application
try {
  # Open(FileName, ReadOnly, Untitled, WithWindow)
  $pres = $ppt.Presentations.Open($In, -1, 0, 0)
  # ppSaveAsPDF = 32
  $pres.SaveAs($Out, 32)
  $pres.Close()
} finally {
  $ppt.Quit()
  [System.Runtime.Interopservices.Marshal]::ReleaseComObject($ppt) | Out-Null
}
Write-Output "exported $Out"
