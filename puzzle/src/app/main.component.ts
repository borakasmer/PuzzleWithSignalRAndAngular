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

  cardList : Array<FrozenPuzzle>;

  bgPath = "/assets/images/frozen/";
  bgImage: string = "/assets/images/frozen/back.jpg"
  cardBgImage: string = "/assets/images/frozen/cardBack.jpg";
  barcodeImageName: string
  barcodeImageUrl: string;
  height: number = 400;
  width: number = 400;
  IsLogin: boolean = false;
  _connectionId: string;
  constructor(private service: PuzzleService) { }

  public ngOnInit() {
    this._hubConnection = new HubConnection("http://localhost:5000/puzzle?key=main");

    this._hubConnection
      .start()
      .then(() => console.log("Hub_Connection Start!"))
      .catch(err => console.log('Error while establishing connection :('));

    this._hubConnection.on('GetConnectionId', (barcode: string, connectionId: string, imageName: string) => {
      this.barcodeImageUrl = barcode;
      this.barcodeImageName = imageName;

      this._connectionId = connectionId;
      console.log("Barcode Image :" + barcode);
      console.log("ConnectionID :" + connectionId);
    });

    this._hubConnection.on('Connected', (data: string) => {
      //Get Cards
      this.service.GetAllCards(this._connectionId).subscribe(result => {
        //console.log(JSON.stringify(result));

        this.cardList = result;//this.GroupTable(result,3);
        console.log(JSON.stringify(this.cardList));
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
  public GroupTable(array,count:number){
    //3'lü kolonlar halinde sıralama
    var Pair3list = [];
    var dataSet = []
    for (let card of array) {
      dataSet.push(card);
      if (dataSet.length % count == 0) {
        Pair3list.push(dataSet);
        dataSet = [];
      }
    }
    if (dataSet.length > 0) {
      Pair3list.push(dataSet);
      dataSet = [];
    }
    //--------------------------------
    return Pair3list;
  }
  //Barcode'un yüklenmesi bitmeden sürekli cmd+R yapılır ise resimler silinmeden kalır.
  DeleteImage() {
    this._hubConnection.invoke("DeleteImage", this.barcodeImageName)
      .then(result => {
        console.log("Image Deleted");
      });
  } 
}