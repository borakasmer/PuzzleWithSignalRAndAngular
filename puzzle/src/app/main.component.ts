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

  cardList: Array<FrozenPuzzle>;

  bgPath = "/assets/images/frozen/";
  bgImage: string = "/assets/images/frozen/back.jpg"
  cardBgImage: string = "/assets/images/frozen/cardBack.jpg";
  barcodeImageName: string
  barcodeImageUrl: string;
  height: number = 400;
  width: number = 400;
  IsLogin: boolean = false;
  _connectionId: string;
  _connectionIDControlPage: string;
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

    this._hubConnection.on('Connected', (connectionIDControlPage: string) => {
      this._connectionIDControlPage = connectionIDControlPage;
      console.log("ControlPageConnectionID :" + this._connectionIDControlPage);
      //Get Cards
      this.service.GetAllCards(this._connectionId, false).subscribe(result => {
        //console.log(JSON.stringify(result));

        var data = result.forEach(card => {
          card.controlCardBgImage = this.cardBgImage;
        });

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

    this._hubConnection.on('OpenCard', (id: number) => {
      //Find Card
      var card = this.cardList.filter(card => card.id == id)[0];
      //Üst üste tıklanamasın
      if (!card.isShow) {
        card.isShow = true;
        card.controlCardBgImage = this.bgPath + card.name;
        console.log(id + "-Card Open");

        //Diğer eşi veya bir başka tamamlanmamış(IsDone==false) açık kart var ise
        //if (this.cardList.filter(c => c.isShow == true && card.isDone == false).length > 1) { ==>CARD :)
        if (this.cardList.filter(c => c.isShow == true && c.isDone == false).length > 1) {
          //1-) Diğer Eşi        
          /*           var IsPairCardOpen = this.cardList.filter(card => card.id == this.CloneID(id) && card.isShow).length > 0 ? true : false; */
          /* var IsPairCardOpen = this.cardList.filter(crd => crd.id == this.CloneID(id) && crd.isShow).length > 0 ? true : false; */
          var pairID = this.CloneID(id);
          var IsPairCardOpen = this.cardList.filter(crd => crd.id == pairID && crd.isShow).length > 0 ? true : false;

          //2 DURUM VAR ==> 2'SİNDE DE AYRI AYRI MI BAKALIM DOĞRUMU DEĞİL Mİ DİYE, YOKSA BURDAN CONTROL'A BİLDİRİM Mİ GÖNDERELİM?
          //.BİLDİRİM İÇİN CONNECTIONID LAZIM.VE NETWORK PAKET ISI VAR. SUNUCUYA YÜK. DİĞER DURUMDA KOD TEKRARI VAR. CLIENT SIDE ÇÖZÜM.
          if (IsPairCardOpen) {
            console.log("Ok");
            //Açık çift Tamamlanır.
            this.cardList.filter(cd => cd.isShow && cd.isDone == false).forEach(f => {
              //f.controlCardBgImage = this.cardBgImage;
              f.isDone = true;
            });
            var isReset: boolean = false;
            //Hepsi bitti demek. Oyun Tamamlandı
            if (this.cardList.filter(c => c.isDone == false).length == 0) {
              isReset = true;
              //Get Cards
              this.service.GetAllCards(this._connectionId, true).subscribe(result => {
                //console.log(JSON.stringify(result));

                var data = result.forEach(card => {
                  card.controlCardBgImage = this.cardBgImage;
                });

                this.cardList = result;//this.GroupTable(result,3);
                console.log(JSON.stringify(this.cardList));
                this.IsLogin = true;
                this.bgImage = "/assets/images/frozen/back2.jpg"
              },
                err => console.log(err),
                () => {
                  console.log("Card List Reset");

                  //Control Page'e Olumlu bildir.
                  this.NotifyControlPage(id, true, isReset);
                  //-----------------------------
                }
              )
            }
          }
          else//Eşi değil yanlış kart açılmış
          {
            console.log("Not Ok");
            //Bekletemek lazım. Açılan resim kayboluyor.
            setTimeout(() =>
              //Açık çift kapatılır.
              this.cardList.filter(cd => cd.isShow == true && cd.isDone == false).forEach(f => {
                f.controlCardBgImage = this.cardBgImage;
                f.isShow = false;
                f.isDone = false;
              })
              , 2000);
            //-------------     
            //Control Page'e Olumsuz bildir.
            this.NotifyControlPage(id, false, isReset);
            //-----------------------------      
          }
        }
      }
    });

  }

  public CloneID(ID: number): number {
    if (ID < 100) {
      return parseInt(ID + "0" + ID);
    }
    else {
      return parseInt(ID.toString().split("0")[0]);
    }
  }

  /*
    public GroupTable(array, count: number) {
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
    */

  //Barcode'un yüklenmesi bitmeden sürekli cmd+R yapılır ise resimler silinmeden kalır.
  DeleteImage() {
    this._hubConnection.invoke("DeleteImage", this.barcodeImageName)
      .then(result => {
        console.log("Image Deleted");
      });
  }
  NotifyControlPage(id: number, result: boolean, isReset: boolean = false) {
    this._hubConnection.invoke("NotifyControlPage", this._connectionIDControlPage, id, result, isReset)
      .then(result => {
        console.log("Card Result Notify To Control Page");
      });
  }
}