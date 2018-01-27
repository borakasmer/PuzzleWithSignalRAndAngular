import { Component } from '@angular/core';
import { HubConnection } from '@aspnet/signalr-client';
import { Console } from '@angular/core/src/console';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'app';
  private _hubConnection: HubConnection;
  bgImage:string="/assets/images/frozen/back.jpg"
  barcodeImageName:string
  barcodeImageUrl:string;
  height:number=400;
  width:number=400;

  public ngOnInit() {
    this._hubConnection = new HubConnection("http://localhost:5000/puzzle");

    this._hubConnection
    .start()
    .then(()=>console.log("Hub_Connection Start!"))
    .catch(err => console.log('Error while establishing connection :('));

    this._hubConnection.on('GetConnectionId', (barcode: string,connectionId:string,imageName:string) => {
      this.barcodeImageUrl=barcode;
      this.barcodeImageName=imageName;
      console.log("Barcode Image :"+barcode);
      console.log("ConnectionID :"+connectionId);     
    });

  }
  DeleteImage(){
    this._hubConnection.invoke("DeleteImage",this.barcodeImageName)
    .then(result => {
      console.log("Image Deleted");
    });
  }
}
