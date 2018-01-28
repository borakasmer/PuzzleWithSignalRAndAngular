import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HubConnection } from '@aspnet/signalr-client';
import { Console } from '@angular/core/src/console';
import { PuzzleService } from '../Services/Indexservice';

@Component({
    selector: 'main_page',
    templateUrl: 'main.component.html',
    styleUrls: ['./main.css']
})

export class MainComponent implements OnInit {
    private _hubConnection: HubConnection;

  cardList: Array<FrozenPuzzle>

  bgImage: string = "/assets/images/frozen/back.jpg"
  cardBgImage: string = "/assets/images/frozen/cardBack.jpg";
  barcodeImageName: string
  barcodeImageUrl: string;
  height: number = 400;
  width: number = 400;
  IsLogin: boolean = false;

  constructor(private service: PuzzleService) { }

  public ngOnInit() {
    this._hubConnection = new HubConnection("http://localhost:5000/puzzle");

    this._hubConnection
      .start()
      .then(() => console.log("Hub_Connection Start!"))
      .catch(err => console.log('Error while establishing connection :('));

    this._hubConnection.on('GetConnectionId', (barcode: string, connectionId: string, imageName: string) => {
      this.barcodeImageUrl = barcode;
      this.barcodeImageName = imageName;

      console.log("Barcode Image :" + barcode);
      console.log("ConnectionID :" + connectionId);
    });

    this._hubConnection.on('Connected', (data: string) => {
      //Get Cards
      this.service.GetAllCards().subscribe(result => {
        this.cardList = result
        this.IsLogin = true;
        this.bgImage = "/assets/images/frozen/back2.jpg"
      },
        err => console.log(err),
        () => {
          console.log("Card List Loaded");
        }
      )
    });

  }
  DeleteImage() {
    this._hubConnection.invoke("DeleteImage", this.barcodeImageName)
      .then(result => {
        console.log("Image Deleted");
      });
  }

}