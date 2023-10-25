
let inpImageFile;
let inpSubpixelHeight;
let inpSubpixelWidth;
let inpDiagonalOffset;
let inpBrightScale;
let inpBrightAdd;
let inpSubpixelColour0, inpSubpixelColour1, inpSubpixelColour2;

let subpixelColours, subpixelColoursNormalised;

let inputImg, inputData, inputData0to1;
let cnvMain, ctxMain;
let cnvHidden, ctxHidden;
let outputPZImg;

let imageLoaded;

window.addEventListener("load", init);

function init()
{
    inpImageFile = document.getElementById("inpImageFile");
    inpImageFile.addEventListener("change", () => {
        imageLoaded = false;
        loadImage();
    });

    inpSubpixelHeight = document.getElementById("inpSubpixelHeight");
    inpSubpixelHeight.value = 3;
    inpSubpixelHeight.addEventListener("change", () => {
        validateChange(inpSubpixelHeight);
        applyEffect()
    });
    inpSubpixelHeight.addEventListener("input", validateInput);

    inpSubpixelWidth = document.getElementById("inpSubpixelWidth");
    inpSubpixelWidth.value = 1;
    inpSubpixelWidth.addEventListener("change", () => {
        validateChange(inpSubpixelWidth);
        applyEffect()
    });
    inpSubpixelWidth.addEventListener("input", validateInput);

    inpDiagonalOffset = document.getElementById("inpDiagonalOffset");
    inpDiagonalOffset.value = 0;
    inpDiagonalOffset.addEventListener("change", () => {
        validateChange(inpDiagonalOffset);
        applyEffect()
    });
    inpDiagonalOffset.addEventListener("input", validateInput);


    inpBrightScale = document.getElementById("inpBrightScale");
    inpBrightScale.value = 0;
    inpBrightScale.addEventListener("change", () => {
        validateChange(inpBrightScale);
        applyEffect()
    });
    inpBrightScale.addEventListener("input", validateInput);

    inpBrightAdd = document.getElementById("inpBrightAdd");
    inpBrightAdd.value = 0;
    inpBrightAdd.addEventListener("change", () => {
        validateChange(inpBrightAdd);
        applyEffect()
    });
    inpBrightAdd.addEventListener("input", validateInput);

    
    inputImg = new Image();
    inputImg.addEventListener("load", () => {
        cnvMain.width = inputImg.width;
        cnvMain.height = inputImg.height;
        cnvHidden.width = inputImg.width;
        cnvHidden.height = inputImg.height;
        ctxHidden.drawImage(inputImg, 0, 0);
        
        inputData = ctxHidden.getImageData(0, 0, cnvMain.width, cnvMain.height);
        inputData0to1 = new Float32Array(inputData.data.length);
        for (let i = 0; i < inputData.data.length; i++) inputData0to1[i] = inputData.data[i] / 255;
        
        outputPZImg = new PZImage(new Image(inputImg.width, inputImg.height), cnvMain, ctxMain, 8);
        imageLoaded = true;
        applyEffect();
    });


    subpixelColours = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
    subpixelColoursNormalised = [
        getNormalisedColour(subpixelColours[0]),
        getNormalisedColour(subpixelColours[1]),
        getNormalisedColour(subpixelColours[2])
    ];

    inpSubpixelColour0 = document.getElementById("inpSubpixelColour0");
    inpSubpixelColour0.value = arrayToColourInput(subpixelColours[0]);
    inpSubpixelColour0.addEventListener("change", () => {
        subpixelColours[0] = colourInputToArray(inpSubpixelColour0.value);
        subpixelColoursNormalised[0] = getNormalisedColour(subpixelColours[0]);
        applyEffect();
    });

    inpSubpixelColour1 = document.getElementById("inpSubpixelColour1");
    inpSubpixelColour1.value = arrayToColourInput(subpixelColours[1]);
    inpSubpixelColour1.addEventListener("change", () => {
        subpixelColours[1] = colourInputToArray(inpSubpixelColour1.value);
        subpixelColoursNormalised[1] = getNormalisedColour(subpixelColours[1]);
        applyEffect();
    });

    inpSubpixelColour2 = document.getElementById("inpSubpixelColour2");
    inpSubpixelColour2.value = arrayToColourInput(subpixelColours[2]);
    inpSubpixelColour2.addEventListener("change", () => {
        subpixelColours[2] = colourInputToArray(inpSubpixelColour2.value);
        subpixelColoursNormalised[2] = getNormalisedColour(subpixelColours[2]);
        applyEffect();
    });
    
    

    cnvMain = document.getElementById("cnvMain");
    ctxMain = cnvMain.getContext("2d");

    cnvMain.addEventListener("mousedown", (event) => { if (imageLoaded) outputPZImg.mouseDown(event) });
    window.addEventListener("mouseup", (event) => { if (imageLoaded) outputPZImg.mouseUp(event) });
    window.addEventListener("mousemove", (event) => { if (imageLoaded) outputPZImg.mouseMoved(event) });
    cnvMain.addEventListener("wheel", (event) => { if (imageLoaded) outputPZImg.scrolled(event) });

    cnvHidden = document.createElement("canvas");
    ctxHidden = cnvHidden.getContext("2d");
}

function loadImage()
{
    inputImg.src = URL.createObjectURL(inpImageFile.files[0]);
}

function getNormalisedColour(c)
{
    let mag = Math.sqrt(c[0] * c[0] + c[1] * c[1] + c[2] * c[2]);
    return [c[0] / mag, c[1] / mag, c[2] / mag];
}

function getSubpixelContribution(inputCol, subpixCol)
{
    return Math.sqrt(inputCol[0] * subpixCol[0] * inputCol[0] * subpixCol[0] +
                     inputCol[1] * subpixCol[1] * inputCol[1] * subpixCol[1] +
                     inputCol[2] * subpixCol[2] * inputCol[2] * subpixCol[2]);
}

function applyEffect()
{
    if (!imageLoaded) return;

    let outputData = ctxHidden.createImageData(inputData.width, inputData.height);

    const IMG_WIDTH = cnvMain.width;
    const IMG_HEIGHT = cnvMain.height;
    const subPixelHeight = parseInt(inpSubpixelHeight.value);
    const subPixelWidth = parseInt(inpSubpixelWidth.value);
    const diagonalOffset = parseInt(inpDiagonalOffset.value);
    const brightScale = parseFloat(inpBrightScale.value);
    const brightAdd = parseInt(inpBrightAdd.value);

    let get0to1InputPixelVal = (x, y) => {
        let index = (y * IMG_WIDTH + x) * 4;
        return [
            inputData0to1[index + 0],
            inputData0to1[index + 1],
            inputData0to1[index + 2]
        ];
    }
    let setOutputPixel = (x, y, r, g, b) => {
        let index = (y * IMG_WIDTH + x) * 4;
        outputData.data[index + 0] = r;
        outputData.data[index + 1] = g;
        outputData.data[index + 2] = b;
        outputData.data[index + 3] = 255;
    }

    let subPixelOffset = 0;
    for (let y = 0; y < IMG_HEIGHT; y += subPixelHeight)
    {
        let subPixelIndex = subPixelOffset;
        for (let x = 0; x < IMG_WIDTH; x += subPixelWidth)
        {
            let val = 0;
            let dy = 0;
            let dx = 0;
            while (y + dy < IMG_HEIGHT && dy < subPixelHeight)
            {
                dx = 0;
                while (x + dx < IMG_WIDTH && dx < subPixelWidth)
                {
                    let pixel = get0to1InputPixelVal(x + dx, y + dy);
                    let contribution = getSubpixelContribution(pixel, subpixelColoursNormalised[subPixelIndex]);
                    val += contribution;
                    dx++;
                }

                dy++;
            }

            val /= dy * dx;
            val *= 255;
            val = Math.min(scaleColour(val, brightScale), 255);
            val = Math.min(Math.max(val + brightAdd, 0), 255);

            let r = val * subpixelColours[subPixelIndex][0];
            let g = val * subpixelColours[subPixelIndex][1];
            let b = val * subpixelColours[subPixelIndex][2];

            for (let ddy = 0; ddy < dy; ddy++)
            {
                for (let ddx = 0; ddx < dx; ddx++)
                {
                    setOutputPixel(x + ddx, y + ddy, r, g, b);
                }
            }

            subPixelIndex = (subPixelIndex + 1) % 3;
        }

        subPixelOffset = (subPixelOffset + diagonalOffset) % 3;
    }

    ctxHidden.putImageData(outputData, 0, 0);
    outputPZImg.image.src = cnvHidden.toDataURL();
    //outputPZImg automatically gets drawm to main canvas on it's image's load event
}

function scaleColour(val, brightScale)
{
    return (-brightScale * val + (1 - 255 * -brightScale)) * val;
}

function validateInput(event)
{
    const element = event.currentTarget;
    let val = parseFloat(element.value);
    const min = parseFloat(element.min);
    const max = parseFloat(element.max);
    if (val < min) element.value = min;
    if (val > max) element.value = max;
}

function validateChange(element)
{
    let val = parseFloat(element.value);
    const min = parseFloat(element.min);
    const max = parseFloat(element.max);
    if (isNaN(val))
    {
        val = 0;
        element.value = 0;
    }
    if (val < min) element.value = min;
    if (val > max) element.value = max;
}

function colourInputToArray(value)
{
    let r = value.slice(1, 3);
    let g = value.slice(3, 5);
    let b = value.slice(5, 7);

    r = parseInt(r, 16);
    g = parseInt(g, 16);
    b = parseInt(b, 16);

    return [r / 255, g / 255, b / 255];
}

function arrayToColourInput(array)
{
    let r = (array[0] * 255).toString(16).padStart(2, "0");
    let g = (array[1] * 255).toString(16).padStart(2, "0");
    let b = (array[2] * 255).toString(16).padStart(2, "0");

    return "#" + r + g + b;
}