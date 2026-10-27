const https=require('https');
https.get('https://docs.google.com/spreadsheets/d/e/2PACX-1vQmzSSzvInJvvFDV-D_BTi7p5VrhUjfB3ja6uAy8v44epabHqWsOb6SZvnCMCVQCLnrZYFGoIOfKLnt/pub?gid=359397000&single=true&output=csv&_cb='+Date.now(),(res)=>{
  let d='';
  res.on('data',c=>d+=c);
  res.on('end',()=>{
    const lines=d.split('\n');
    for(let i=0;i<Math.min(65,lines.length);i++) console.log(i+':'+lines[i]);
  });
});
