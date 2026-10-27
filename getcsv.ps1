$uri = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQmzSSzvInJvvFDV-D_BTi7p5VrhUjfB3ja6uAy8v44epabHqWsOb6SZvnCMCVQCLnrZYFGoIOfKLnt/pub?gid=359397000&single=true&output=csv&_cb=' + [DateTimeOffset]::Now.ToUnixTimeSeconds()
try {
  $r = Invoke-WebRequest -Uri $uri -UseBasicParsing
  $r.Content -split "`n" | Select-Object -First 65 | ForEach-Object { $i=0 } { $i++; "$i`:$_" }
} catch {
  $_ | Out-String
}
