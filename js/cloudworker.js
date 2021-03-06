class CloudBoxContainer {
    constructor(ctx) {
        this.clouds = [];
        this.ctx = ctx;
    }

    addCloudBox(x, y, width, height, density, size, shade) {
        let cloudBox = new CloudBox(x, y, width, height, density, size, shade, this.ctx);
        this.clouds.push(cloudBox);
    }

    render() {
        this.ctx.clearRect(0, 0, w, h);
        this.clouds.forEach((cloud) => {
            cloud.drawCloud();
        });
        let coordinates = [];
        this.clouds.forEach((box) => {
            let current = {
                x: Math.round(box.x),
                y: Math.round(box.y),
                width: Math.round(box.w),
                height: Math.round(box.h)
            }
            coordinates.push(current);
        });
        this.emitJSON({ msg: 'borders', borders: JSON.stringify(coordinates) });
    }

    emitJSON(message) {
        channel.postMessage(message);
    }
}

class CloudBox {
    constructor(x, y, width, height, density, size, shade, ctx) {
        this.x = x;
        this.y = y;
        this.w = width;
        this.h = height;
        this.ctx = ctx;
        this.drawBoundingBoxes = false;
        this.cloud = new Cloud(this.x, this.w, this.y, this.h, density, size, shade, this.ctx);
    }

    drawCloud() {
        if (this.drawBoundingBoxes) {
            this.ctx.strokeStyle = 'white';
            this.ctx.strokeRect(this.x, this.y, this.w, this.h);
        }
        this.cloud.newRandom();
        this.cloud.render();
    }
}

class Cloud {
    constructor(x, w, y, h, number, size, shade, ctx) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.number = number;
        this.size = size;
        this.circles = [];
        this.shade = shade;
        this.ctx = ctx;
    }

    addCircle(x, y, radius) {
        this.circles.push(new GradientCircle(x, y, radius, this.shade));
    }

    randomCircles(number, x, w, y, h, radius) {
        this.circles = [];
        for (let i = 0; i < number; i++) {
            this.addCircle(x + w * Math.random(), y + h * Math.random(), radius * Math.random());
        }
    }

    newRandom() {
        this.randomCircles(this.number, this.x, this.w, this.y, this.h, this.size);
    }

    render() {
        this.circles.forEach((circle) => {
            circle.render(this.ctx);
        });
    }
}

class GradientCircle {
    constructor(x, y, radius, shade) {
        this.x = x;
        this.y = y;
        this.velX = Math.random();
        this.velY = Math.random();
        this.shade = shade;
        this.radius = radius;
        let minRadius = 40;
        if (this.radius < minRadius) {
            this.radius = minRadius;
        }
        let colorRand = Math.random();
        if (colorRand > 0.8) {
            this.basecolor = '255,' + this.shade;
        } else if (colorRand > 0.6) {
            this.basecolor = '150,' + this.shade;
        } else if (colorRand > 0.4) {
            this.basecolor = '80,' + this.shade;
        } else {
            this.basecolor = '30,' + this.shade;
        }
        this.luminosity = colorRand / 20;
        this.color1 = 'rgba(' + this.basecolor + ',' + this.luminosity + ')';
        this.color2 = 'rgba(' + this.basecolor + ',' + this.luminosity / 2 + ')';
        this.color3 = 'rgba(' + this.basecolor + ', 0)';
        this.midpoint = Math.random() * 0.5;
    }

    render(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        let gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
        gradient.addColorStop(0, this.color1);
        gradient.addColorStop(this.midpoint, this.color2);
        gradient.addColorStop(1, this.color3);
        ctx.fillStyle = gradient;
        ctx.fill();
    }
}

let c; //Canvas-element
let pen; //Canvasens rendering context

self.onmessage = (e) => {
    //Initialiserar bakgrunds-workern med canvasens 
    //nuvarande storlek, nuvarande grafik-config 
    if (e.data.msg == 'init') {
        c = e.data.canvas;
        pen = c.getContext('2d');
        w = e.data.w;
        h = e.data.h;
        renderClouds();
    }

    //Uppdaterar canvasens upplösning till skärmens
    //upplösning då huvudsidan rapporterar att 
    //upplösningen ändrats
    if (e.data.msg === 'resize') {
        w = e.data.w;
        h = e.data.h;
        updateCanvasRes(w, h);
        renderClouds();
    }
}

//Uppdaterar canvasens storlek med en ny höjd och
//bredd, samt ritar om alla stjärnor så de passar inom den
//nya skärmytan
function updateCanvasRes(newW, newH) {
    w = newW;
    h = newH;
    c.height = h;
    c.width = w;
}

function renderClouds() {
    //Objekt som innehåller molnklusterna
    let container = new CloudBoxContainer(pen);

    let c1, c2, shade, x, y, wi, he;

    function fancyCloudGen() {
        //Skalar molnet på X och Y-axeln
        let xSkew = 0.5 + Math.random();
        let ySkew = 0.5 + Math.random();

        //Random modifier på gröna och blåa kanalen
        let c1Mod = Math.random();
        let c2Mod = Math.random();

        //Antal molnkluster
        let number = 35;

        //Inverterar X respektive Y ifall de är sanna
        let xInvert = Math.random() > 0.5;
        let yInvert = Math.random() > 0.5;

        //Returnerar inverterad i, används för att invertera riktningen på molnen 
        function checkInverted(axis, i) {
            if (axis) {
                return number - i;
            } else {
                return i;
            }
        }

        for (let i = 0; i < number; i++) {
            //Räknar ut färgerna för röda och gröna kanalerna och lägger dem i shade
            c1 = Math.round((255 * c1Mod) * i / number);
            c2 = 255 - Math.round((255 * c2Mod) * i / number);
            shade = c1 + ',' + c2;

            //Sätter nuvarande molnklusters position
            x = w * Math.random() * 0.2 + w / number * (checkInverted(xInvert, i) * xSkew) + Math.sin(i) * number;
            y = h * Math.random() * 0.2 + number + h / number * (checkInverted(yInvert, i) * ySkew) + Math.sin(i) * number;
            x += Math.sin(x / w * Math.PI * 2) * 100 * xSkew;
            y += Math.sin(y / h * Math.PI * 2) * 100 * ySkew;

            //Sätter molnklustrets bredd och höjd
            wi = 300 + 200 * Math.random();
            he = 300 + 200 * Math.random();

            //Skapar molnkluster
            container.addCloudBox(
                x - 100 - wi * 0.5,
                y - 100 - he * 0.5,
                wi + i * 20,
                (he + i * 20) / 2,
                200 + 50 * Math.random(), //molndenistet inom chunken
                75 + 25 * Math.random(), //storlek på gradient-cirklarna
                shade);
        }
    }

    fancyCloudGen();
    //Renderar alla molnkluster
    container.render();
}

//kanal för att prata med starworker
const channel = new BroadcastChannel('channel');