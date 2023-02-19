const http = new XMLHttpRequest()
const preview = document.getElementById('preview')
const error = document.getElementById('error')

let scanner = new Instascan.Scanner({
    video: preview,
    mirror: false,
});

const handleScan = (content) => {
    const loader = document.getElementById("loader")
    loader.classList.remove("hide")
    let api_request = "api/checkWebsite/"+content
    let request = http.open("GET",api_request)
    http.send()
    http.onreadystatechange=function(){
        if (this.readyState==4 && this.status==200){
            const navigator = window.navigator
            const response = JSON.parse(http.response)
            const suspoints = response.suspoints
            const result = document.getElementById("result")
            result.classList.remove("hide")
            loader.classList.add("hide")
            const resultTitle = document.getElementById("value")
            const colorString = "color: hsl("+ (130 - suspoints * 13) +"deg, 100%, 50%)"
            resultTitle.setAttribute("style",colorString)
            resultTitle.innerHTML = suspoints+"<p>/10</p>"
            const details =  document.getElementById("details")
            details.innerHTML = response.info
            try {
                navigator.vibrate(200)
            } catch (error) {}
        }
    }
}

scanner.addListener('scan', handleScan);

Instascan.Camera.getCameras().then(function (cameras) {
    if (cameras.length > 0) {
        scanner.start(cameras[0]);
    } else {
        preview.setAttribute("style","display: none;")
        error.setAttribute("style","")
    }
}).catch(function (e) {
    console.error(e);
});