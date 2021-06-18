const video = document.getElementById('video');
let likelyAge = [];

Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
    faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
    faceapi.nets.faceExpressionNet.loadFromUri('/models'),
    faceapi.nets.ageGenderNet.loadFromUri("/models"),
]).then(playVideo)


function playVideo(){
    navigator.getUserMedia(
        { video: { } },
        stream => video.srcObject = stream,
        error => console.error(error)
    )
}


video.addEventListener('play', () => {
    const canvas = faceapi.createCanvasFromMedia(video);
    document.body.append(canvas);
    
    const displaySize = { width: video.offsetWidth, height: video.offsetHeight };
    faceapi.matchDimensions(canvas, displaySize);


    setInterval(async () => {
        const detections = await faceapi.detectAllFaces(video,
            new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks()
            .withFaceExpressions()
            .withAgeAndGender()

            const resizedDetections = faceapi.resizeResults( detections, 
                displaySize )

            //To clear the canvas
            canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);

            if (!Array.isArray(detections) || detections.length < 1) {
                return;
            }

            //To draw the canvas
            faceapi.draw.drawDetections(canvas, resizedDetections)
            faceapi.draw.drawFaceLandmarks(canvas, resizedDetections)
            faceapi.draw.drawFaceExpressions(canvas, resizedDetections)

            const [ { gender } ] = resizedDetections;
            const [{ age } = {}] = resizedDetections;
            const interpolatedAge = interpolateAgePredictions(age);
            const bottomRight = {
            x: resizedDetections[0].detection.box.bottomRight.x - 70,
            y: resizedDetections[0].detection.box.bottomRight.y
            };


            new faceapi.draw.DrawTextField(
                [`${faceapi.utils.round(interpolatedAge, 0)} years old`, gender],
                bottomRight
                ).draw(canvas);

            }, 100)
})

function interpolateAgePredictions(age) {
      likelyAge = [age].concat(likelyAge).slice(0, 30);
      const avgPredictedAge =
        likelyAge.reduce((total, a) => total + a) / likelyAge.length;
      return avgPredictedAge;
    }


