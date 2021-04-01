if(!window.pickied) {
	var pickify = {
		pickifyZoomerRatio: 11,  //Must be Odd for accurate,
		pickifyZoomerItems: [],
		pickifyZoomer: null
	}

	var timeoutOnRecapture;
	
	initialize()
} 
else if(!pickify.pickifyZoomer) {
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
		if(request.action === 'returnCapturedImageData') {
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
		console.log('down')
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
	 pickify.pickifyZoomer.style.left = e.pageX + 'px';
	 pickify.pickifyZoomer.style.top = e.pageY + 'px';
	let startXPixelPositionOfImageToShowInZoomer = e.pageX - Math.floor(pickify.pickifyZoomerRatio / 2);
	let startYPixelPositionOfImageToShowInZoomer = e.pageY - window.pageYOffset - Math.floor(pickify.pickifyZoomerRatio / 2);
	let capturedImageData = pickify.ctx.getImageData(startXPixelPositionOfImageToShowInZoomer, startYPixelPositionOfImageToShowInZoomer, pickify.pickifyZoomerRatio, pickify.pickifyZoomerRatio).data;
	for(let rgbIndex = 0; rgbIndex < capturedImageData.length; rgbIndex += 4) {
		pickify.pickifyZoomerItems[rgbIndex / 4].style.backgroundColor = `rgba(${capturedImageData[rgbIndex]}, ${capturedImageData[rgbIndex + 1]}, ${capturedImageData[rgbIndex + 2]})`;
	}
}

//todo
function getCurrentSelectColor(e) {
	let middleHighlightedTd = document.querySelectorAll(`#pickify-zoomer > table tr:nth-child(${Math.floor(pickify.pickifyZoomerRatio / 2) + 1}) > td:nth-child(${Math.floor(pickify.pickifyZoomerRatio / 2)  + 1})`)[0];
	console.log(middleHighlightedTd.style.backgroundColor);
	console.log(pickifyRGBtoHEX(middleHighlightedTd.style.backgroundColor));
}

function recaptureTab(){

	if(!pickify.pickifyZoomer) return;
	//Hide Zoomer for recapturing
	findAndToggleZoomer('none');
	//IMPORTANT: This one trigger on Scroll and Resize. Make sure recapture 1 time after scroll.
	clearTimeout(timeoutOnRecapture);
	timeoutOnRecapture = setTimeout(() => {
		chrome.extension.sendMessage({action: 'recaptureTab'}, function() {
			findAndToggleZoomer('unset');
		});
	}, 250);

}

function pickifying(){
	
	destroy();

	let body = document.getElementsByTagName('body')[0];

	let zoomer = zoomerGenerator();
	body.insertAdjacentHTML("beforeend", zoomer);
	pickify.pickifyZoomer = document.getElementById('pickify-zoomer');
	pickify.pickifyZoomerItems = pickify.pickifyZoomer.querySelectorAll('td');
	body.classList.add('pickifying');
	document.addEventListener('mousemove', pickifyMonitor);
	document.addEventListener('click', getCurrentSelectColor);
	document.addEventListener('scroll', recaptureTab);
	window.addEventListener('resize', recaptureTab);

}

function findAndRemoveZoomer() {
	if(pickify.pickifyZoomer) {
		pickify.pickifyZoomer.remove();
	}

	pickify.pickifyZoomerItems = [];
	pickify.pickifyZoomer = null;

}
function findAndToggleZoomer(display = 'none') {
	if(pickify.pickifyZoomer) {
		pickify.pickifyZoomer.style.display = display;
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
	document.removeEventListener('mousemove', pickifyMonitor)
	document.removeEventListener('click', getCurrentSelectColor)
	document.removeEventListener('scroll', recaptureTab)
	window.removeEventListener('resize', recaptureTab)
}