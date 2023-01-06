import { Component, OnInit } from '@angular/core';
import * as p5 from 'p5';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.sass']
})
export class AppComponent implements OnInit {
    title = 'MatrixMe';
    p5: any;
    image: any;
    invert = false;
    matrix = false;
    asciiImg: any;
    img: any;
    darkThreshold = 255;
    lightThreshold = 0;
    spacePadding = 0;
    brightness = 0;
    saturation = 0;
    contrast = 0;
    intensity = 0;
    fitToHeight: any = true;
    showColor: any;
    isArray1: any = true;

    constructor() {
        
    }

    ngOnInit(): void {
        this.p5 = new p5(this.sketch.bind(this), document.getElementById('canvas-container') || undefined);
    }

    blobToDataURL(blob: any, callback: any) {
        var a = new FileReader();
        a.onload = (e: any) => {
            callback(e.target.result);
        }
        a.readAsDataURL(blob);
    }

    onFileChoose(event: any) {
        this.blobToDataURL(event.target.files[0], (data: any) => {
            this.image = data;
            this.p5.setup()
        })
    }

    clampDimensions(width: number, height: number) {
        const asciiImgMaxHeight = 100
        const asciiImgMaxWidth = 100
        const aspectRatio = height / width;
        if (height > width) {
            const newWidth = asciiImgMaxHeight / aspectRatio;
            return [newWidth, asciiImgMaxHeight];
        } else {
            const newHeight = asciiImgMaxWidth * aspectRatio;
            return [asciiImgMaxWidth, newHeight];
        }
    };

    hslToRgb(h: number, s: number, l: number) : number[]{
        let r, g, b;
    
        if(s == 0){
            r = g = b = l; // achromatic
        }else{
            const hue2rgb = (p: number, q: number, t: number) => {
                if(t < 0) t += 1;
                if(t > 1) t -= 1;
                if(t < 1/6) return p + (q - p) * 6 * t;
                if(t < 1/2) return q;
                if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            }
    
            let q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            let p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }
    
        return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    }

    rgbToHsl(r: number, g: number, b: number): number[]{
        r /= 255, g /= 255, b /= 255;
        let max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;
    
        if (max == min) {
            h = s = 0; // achromatic
        } else {
            let d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch(max){
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h = Number(h ? h/6: h);
        }
    
        return [h, s, l];
    }
    

    renderAsciiImagePixel(p5: any, asciiCharArray: any, x: any, y: any, color?: any) {
        const container = document.getElementById('canvas-container');
        const [canvasHeight, canvasWidth] = [container?.clientHeight ?? 0, container?.clientWidth ?? 0];
        const [asciiImgWidth, asciiImgHeight] = this.clampDimensions(this.img.width, this.img.height);
        const aspectRatio = asciiImgHeight / asciiImgWidth;
        let charX, charY;
        if (this.fitToHeight) {
            charY = canvasHeight / asciiImgHeight;
            charX = (canvasHeight / aspectRatio) / asciiImgWidth;
            p5.textSize(canvasHeight / asciiImgHeight)
        } else {
            charX = canvasWidth / asciiImgWidth;
            charY = (canvasWidth * aspectRatio) / asciiImgHeight;
            p5.textSize(canvasWidth / asciiImgWidth)
        }
        if (this.showColor) {
            p5.fill(...asciiCharArray[y][x].color)
        } else {
            p5.fill(this.matrix ? color : '#00FF41')
            asciiCharArray[y][x].color = this.matrix ? color : '#00FF41';
        }
        p5.text(asciiCharArray[y][x].char, x * charX, y * charY);
    }

    sketch(p5: any) {
        const container = document.getElementById('canvas-container');
        const [canvasHeight, canvasWidth] = [container?.clientHeight ?? 0, container?.clientWidth ?? 0];
        p5.setup = () => {
            p5.createCanvas(canvasWidth, canvasHeight);
            p5.background(0)
            p5.loadImage(this.image, (img: any) => {
                const [asciiImgWidth, asciiImgHeight] = this.clampDimensions(img.width, img.height);
                this.asciiImg = p5.createImage(asciiImgWidth, asciiImgHeight);
                this.asciiImg.loadPixels();
                img.loadPixels();
                this.img = img;
            })
        }

        p5.draw = () => {
            p5.background(0)
            const asciiCharArray: any = [];
            const chars1 = `$@B%8&WM#oahkbdpqwmZO0QLCJUYXzcvunxrjft/\|()1{}[]?-_+~<>i!lI;:,"^\`'. `;
            const chars2 = `Ñ@#W$9876543210?!abc;:+=-,. `
            const chars = (this.isArray1 ? chars1 : chars2) + ' '.repeat(this.spacePadding);
            if (this.asciiImg && this.image) {
                const darkThreshold = this.darkThreshold;
                const lightThrshold = this.lightThreshold;
                for (let y = 0; y < this.asciiImg.height; y++) {
                    asciiCharArray[y] = [];
                    for (let x = 0; x < this.asciiImg.width; x++) {
                        const index = (x + y * this.asciiImg.width) * 4;
                        const actualImageX = Math.floor(x / this.asciiImg.width * this.img.width);
                        const actualImageY = Math.floor(y / this.asciiImg.height * this.img.height);
                        const actualImageIndex = (actualImageX + actualImageY * this.img.width) * 4;
                        let [r, g, b] = [this.img.pixels[actualImageIndex], this.img.pixels[actualImageIndex + 1], this.img.pixels[actualImageIndex + 2]]
                        let grayScaleAvg = (r + g + b) / 3
                        grayScaleAvg = grayScaleAvg > darkThreshold ? 255 : grayScaleAvg < lightThrshold ? 0 : grayScaleAvg;
                        if (this.invert) {
                            grayScaleAvg = 255 - grayScaleAvg;
                        }
                        const i = Math.floor((grayScaleAvg * (chars.length - 1)) / 255)
                        const char = chars[i];
                        if (this.showColor) {
                            let [h, s, l] = this.rgbToHsl(r, g, b);
                            l += l * this.brightness; // apply brightness
                            s += s * this.saturation; // apply saturation
                            [r, g, b] = this.hslToRgb(h, s, l);
                            const contrast = this.contrast / 100 + 1;  //convert to decimal & shift range: [0..2]
                            const intercept = 128 * (1 - contrast);
                            [r, g, b] = [r, g, b]
                                        .map(e => e * contrast + intercept) // apply contrast
                                        .map(e => e + e * this.intensity) // apply intensity
                                        .map(e => e > 255 ? 255 : e < 0 ? 0 : e);
                        }
                        asciiCharArray[y][x] = { char, color: this.showColor ? [r, g, b] : undefined };
                        if (!this.matrix) {
                            this.renderAsciiImagePixel(p5, asciiCharArray, x, y);
                        }
                    }
                }
                if (this.matrix) {
                    let color;
                    for (let y = 0; y < this.asciiImg.height; y++) {
                        for (let x = 0; x < this.asciiImg.width; x++) {
                            const colors = ['#003B00', '#008F11', '#00FF41', '#00FF64']
                            if (!asciiCharArray[y - 1] || asciiCharArray[y - 1][x].char === ' ') {
                                color = colors[0];
                            } else {
                                let i = 2;
                                let prevColor = asciiCharArray[y - 1][x].color;
                                let count = 1;
                                while (asciiCharArray[y - i] && asciiCharArray[y - i][x].color === prevColor && count <= 5) {
                                    count++;
                                    prevColor = asciiCharArray[y - i][x].color;
                                    i++;
                                }
                                if (count <= 5) {
                                    color = prevColor
                                } else {
                                    const colorIndex = colors.indexOf(prevColor);
                                    color = colors[colorIndex === 3 ? 3 : colorIndex + 1]
                                }
                            }
                            this.renderAsciiImagePixel(p5, asciiCharArray, x, y, color);
                        }
                    }
                }
            }
        }
    }

}
