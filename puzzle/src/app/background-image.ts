import {Directive, ElementRef, Input} from '@angular/core';
 
@Directive({
    selector: '[backImage]'
})
export class BackgroundImage {
    private el: HTMLElement;

    constructor(el: ElementRef) {
        this.el = el.nativeElement;
    }
    
    private backgroundImage: string;
    @Input()
    set backImage(backImage:string) {this.backgroundImage=backImage; this.ngAfterViewInit()};
    get backImage(){return this.backgroundImage;}
    

    ngAfterViewInit() {
        this.el.style.backgroundImage = 'url(' + this.backgroundImage + ')';
        this.el.style.height="100vh";
        this.el.style.width="100vw";               
        this.el.style.backgroundSize="cover";
        this.el.style.backgroundPosition="center";
        this.el.style.backgroundRepeat="no-repeat";
    }
 
}