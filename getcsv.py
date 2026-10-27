import urllib.request
url='https://docs.google.com/spreadsheets/d/e/2PACX-1vQmzSSzvInJvvFDV-D_BTi7p5VrhUjfB3ja6uAy8v44epabHqWsOb6SZvnCMCVQCLnrZYFGoIOfKLnt/pub?gid=359397000&single=true&output=csv&_cb=123'
try:
    r=urllib.request.urlopen(url,timeout=30)
    data=r.read().decode('utf-8','replace')
    for i,l in enumerate(data.splitlines()[:65]):
        print(i,l)
except Exception as e:
    print(e)
