import {Directive, HostListener, OnInit, Renderer2} from '@angular/core';

@Directive({
  selector: '[appDisableContext]',
  standalone: true
})
export class DisableContextDirective implements OnInit {

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.keyCode === 123 || (event.ctrlKey && event.shiftKey && event.keyCode === 73) ||
        (event.ctrlKey && event.shiftKey && event.keyCode === 67) ||
        (event.ctrlKey && event.shiftKey && event.keyCode === 74) ||
        (event.ctrlKey && event.keyCode === 85)) {
      event.preventDefault();
    }
  }

  constructor(private renderer: Renderer2) { }

  ngOnInit() {
    this.disableContext();
  }

  disableContext() {
    this.renderer.setStyle(document.body, '-webkit-touch-callout', 'none');
    this.renderer.setStyle(document.body, '-webkit-user-select', 'none');
    this.renderer.setStyle(document.body, '-khtml-user-select', 'none');
    this.renderer.setStyle(document.body, '-moz-user-select', 'none');
    this.renderer.setStyle(document.body, '-ms-user-select', 'none');
    this.renderer.setStyle(document.body, 'user-select', 'none');
    this.renderer.setAttribute(document.body, 'oncontextmenu', 'return false;');
  }
}
