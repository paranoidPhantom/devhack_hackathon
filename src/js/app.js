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
            navigator.vibrate(200)
            const response = JSON.parse(http.response)
            console.log(response)
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