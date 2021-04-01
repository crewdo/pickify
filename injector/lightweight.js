if(!window.pickied) {
	var pickify = {
		pickifyZoomerRatio: 11  //Must be Odd for accurate
	}

	var timeoutOnRecapture;
	
	initialize()
} 
else if(!document.getElementById('pickify-zoomer')) {
	pickifying()
}

function pickifyRGBtoHEX(rgb) {
	rgb = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
	function hex(x) {
        return ("0" + parseInt(x).toString(16)).slice(-2);
    }
    return "#" + hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3]);
}

function initialize() {

	window.pickied = 1;

	chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
		if(request.type === 'returnCapturedImageData') {
			pickify.canvas = document.createElement("canvas");
			pickify.ctx = pickify.canvas.getContext("2d");
			pickify.image = new Image();
			pickify.image.onload = function() {
				pickify.canvas.width = window.innerWidth;
				pickify.canvas.height = window.innerHeight;
				pickify.ctx.drawImage(pickify.image, 0, 0, pickify.image.width, pickify.image.height, 0, 0, pickify.canvas.width, pickify.canvas.height);
			};
	
			pickify.image.src = request.data;
		}
	});

	document.onkeydown = function(evt) {
		evt = evt || window.event;
		let isEscape = false;
		if ("key" in evt) {
			isEscape = (evt.key === "Escape" || evt.key === "Esc");
		} else {
			isEscape = (evt.keyCode === 27);
		}
		if (isEscape) destroy();
	};

	pickifying();

}


//todo
function pickifyMonitor(e) {

	if(!pickify.ctx) return;

	let pickifyZoom = document.getElementById('pickify-zoomer');
	pickifyZoom.style.left = e.pageX + 'px';
	pickifyZoom.style.top = e.pageY + 'px';

	let startXPixelPositionOfImageToShowInZoomer = e.pageX - Math.floor(pickify.pickifyZoomerRatio / 2);
	let startYPixelPositionOfImageToShowInZoomer = e.pageY - window.pageYOffset - Math.floor(pickify.pickifyZoomerRatio / 2);
	let capturedImageData = pickify.ctx.getImageData(startXPixelPositionOfImageToShowInZoomer, startYPixelPositionOfImageToShowInZoomer, pickify.pickifyZoomerRatio, pickify.pickifyZoomerRatio).data;
	let tdList = pickifyZoom.querySelectorAll('table td');

	for(let rgbIndex = 0; rgbIndex < capturedImageData.length; rgbIndex += 4) {
		let red = capturedImageData[rgbIndex];
		let green = capturedImageData[rgbIndex + 1];
		let blue = capturedImageData[rgbIndex + 2];
		tdList[rgbIndex / 4].style.backgroundColor = `rgba(${red}, ${green}, ${blue})`;
	}
}

//todo
function getCurrentSelectColor(e) {
	let middleHighlightedTd = document.querySelectorAll(`#pickify-zoomer > table tr:nth-child(${Math.floor(pickify.pickifyZoomerRatio / 2) + 1}) > td:nth-child(${Math.floor(pickify.pickifyZoomerRatio / 2)  + 1})`)[0];
	console.log(middleHighlightedTd.style.backgroundColor);
	console.log(pickifyRGBtoHEX(middleHighlightedTd.style.backgroundColor));
}

function recaptureTab(){
	//IMPORTANT: This one trigger on Scroll and Resize. Make sure recapture 1 time after scroll.
	clearTimeout(timeoutOnRecapture);
	timeoutOnRecapture = setTimeout(() => {
		chrome.extension.sendMessage({type: 'recaptureTab'});
	}, 400);
}

function pickifying(fromReCapture = false){

	findAndRemoveZoomer()
	
	let body = document.getElementsByTagName('body')[0];

	let zoomer = zoomerGenerator()

	body.insertAdjacentHTML("beforeend", zoomer);

	if(!fromReCapture) {
		body.classList.add('pickifying');
		document.addEventListener('mousemove', pickifyMonitor);
		document.addEventListener('click', getCurrentSelectColor);
		document.addEventListener('resize', recaptureTab);
		document.addEventListener('scroll', recaptureTab);
	}

}

function findAndRemoveZoomer() {
	let zoomer = document.getElementById('pickify-zoomer');
	if(zoomer) {
		zoomer.remove();
	}
}

function zoomerGenerator() {
	let presenter = ``;
	let centerSquare = Math.floor(pickify.pickifyZoomerRatio / 2);
	let centerSquareStyle = `border: 1px solid red; border-left-style: double; border-top-style: double;`;

	for(let i = 0; i < pickify.pickifyZoomerRatio; i++) {
		presenter += `<tr>`
		for(let j = 0; j < pickify.pickifyZoomerRatio; j++) {
			presenter += `<td 
							style="width: ${pickify.pickifyZoomerRatio}px; height: ${pickify.pickifyZoomerRatio}px; ${j == centerSquare && i === centerSquare ? centerSquareStyle : ``}">
						  </td>`
		}
		presenter += `</tr>`
	}

	let zoomerDimension = pickify.pickifyZoomerRatio * pickify.pickifyZoomerRatio - 1; // -1 for smoothy pixel

	return `<div id="pickify-zoomer" style="width: ${zoomerDimension}px; height: ${zoomerDimension}px"">
				<table>${presenter}</table>
			</div>`;
}

function destroy() {
	findAndRemoveZoomer();
	document.getElementsByTagName('body')[0].classList.remove('pickifying');
	window.removeEventListener('mousemove', pickifyMonitor)
	window.removeEventListener('click', getCurrentSelectColor)
	['scroll', 'resize'].forEach(function(value, index) {
		window.removeEventListener(value, recaptureTab)
	});
}