import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HubConnection } from '@aspnet/signalr-client';
import { Console } from '@angular/core/src/console';
import { PuzzleService } from '../Services/Indexservice';

enum Category {
  frozen = 1,
  moana = 2
}

@Component({
  selector: 'main_page',
  templateUrl: 'main.component.html',
  styleUrls: ['./main.css?ver=1.2']
})

export class MainComponent implements OnInit {

  root: string = "frozen";
  categoryID: number = 1;
  soundRoot: string = "";
  soundExtension: string = ".wav";
  soundMax: number = 9;
  moveCount=0;

  private _hubConnection: HubConnection;

  cardList: Array<FrozenPuzzle>;
  categoryList: Array<PuzzleCategory>;

  /* bgPath = "/assets/images/frozen/"; */
  bgPath = "/assets/images/" + this.root + "/";
  servicePath = "http://localhost:5000/";
  isWin = false;
  winImage = this.bgPath + "win2.jpg";

  bgImage: string = this.bgPath + "back.jpg"
  cardBgImage: string = this.bgPath + "cardBack.jpg";
  barcodeImageName: string
  barcodeImageUrl: string;
  height: number = 400;
  width: number = 400;
  IsLogin: boolean = false;
  _connectionId: string;
  _connectionIDControlPage: string;
  constructor(private service: PuzzleService,private cdRef: ChangeDetectorRef) { }

  public ngOnInit() {
    this._hubConnection = new HubConnection(this.servicePath + "puzzle?key=main");

    this._hubConnection
      .start()
      .then(() => console.log("Hub_Connection Start!"))
      .catch(err => console.log('Error while establishing connection :('));

    this._hubConnection.on('GetConnectionId', (connectionId: string, imageName: string) => {

      this.playAudio("1");
      this._connectionId = connectionId;

      this._hubConnection.invoke("CreateBarcode", this._connectionId, imageName, this.categoryID)
        .then(result => {
          var barcode: string = result;
          this.barcodeImageUrl = barcode;
          this.barcodeImageName = imageName;

          console.log("Barcode Image :" + barcode);
          console.log("ConnectionID :" + connectionId);
        });
    });

    //Get All Categories    
    this.service.GetCategories().subscribe(result => {    
      //console.log("categoryList :" + JSON.stringify(result));
      this.categoryList = result;
    },
      err => console.log(err),
      () => {
        console.log("Category List Loaded");
      }
    )

    //Farkında olmadan Mobile sayfa refresh olunca ana sayfanın'da refresh olması sağlandı. Amaç ControlConnectionID'nin alınması idi :)
    this._hubConnection.on('Connected', (connectionIDControlPage: string) => {
      this._connectionIDControlPage = connectionIDControlPage;
      console.log("ControlPageConnectionID :" + this._connectionIDControlPage);

      //Get Cards    
      this.service.GetAllCards(this._connectionId, this.categoryID, false).subscribe(result => {
        //console.log(JSON.stringify(result));

        var data = result.forEach(card => {
          card.controlCardBgImage = this.cardBgImage;
        });

        this.cardList = result;//this.GroupTable(result,3);
        console.log(JSON.stringify(this.cardList));
        this.IsLogin = true;
        this.bgImage = this.bgPath + "back2.jpg"

        var soundID = this.getRandomInt(2, this.soundMax)
        this.playAudio(soundID);

        this.moveCount=0;
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
        this.moveCount+=1;
        card.isShow = true;
        card.controlCardBgImage = this.bgPath + card.name;
        this.cdRef.detectChanges(); //Force The Image Change To Angular And Disabled Chrome Cache...
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
              this.playSucess("success.wav");
            });
            var isReset: boolean = false;
            //Hepsi bitti demek. Oyun Tamamlandı
            if (this.cardList.filter(c => c.isDone == false).length == 0) {
              this.playSucess("win.wav");

              this.isWin = true;

              setTimeout(() => {
                this.isWin = false;
                var soundID = this.getRandomInt(2, this.soundMax);
                this.playAudio(soundID);

                isReset = true;

                //Get Cards
                this.service.GetAllCards(this._connectionId, this.categoryID, true).subscribe(result => {
                  //console.log(JSON.stringify(result));

                  var data = result.forEach(card => {
                    card.controlCardBgImage = this.cardBgImage;
                  });

                  this.cardList = result;//this.GroupTable(result,3);
                  console.log(JSON.stringify(this.cardList));
                  this.IsLogin = true;
                  this.bgImage = this.bgPath + "back2.jpg"
                },
                  err => console.log(err),
                  () => {
                    console.log("Card List Reset");
                    this.moveCount=0;
                    //Control Page'e Olumlu bildir.
                    this.NotifyControlPage(id, true, isReset);
                    //-----------------------------
                  }
                )
              }
                , 6000);
            }
            else {
              //Control Page'e Olumlu bildir.
              this.NotifyControlPage(id, true, isReset);
              //-----------------------------
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
              , 1000);
            //-------------     
            //Control Page'e Olumsuz bildir.
            this.NotifyControlPage(id, false, isReset);
            //-----------------------------      
          }
        }
      }
    });
  }

  //Asla FrozenPuzzle table'da ID'sine '0' geçen bir kayıt bulundurma :) ID==10 olan kayıt silindi. Tekrar insert edilerek 19 yapıldı..
  public CloneID(ID: number): number {
    if (ID < 100) {
      return parseInt(ID + "0" + ID);
    }
    else {
      return parseInt(ID.toString().split("0")[0]);
    }
  }
  /*For Play Music On Safari => Safari / Settings / Setting For This Website / Allow All Auto Play*/
  audio: any;
  playAudio(url: string) {
    if (this.audio) {
      this.audio.pause();
      //this.audio = null;
    }
    else {
      this.audio = new Audio();
    }
    this.audio.src = "/assets/sounds/" + this.soundRoot + url + this.soundExtension;
    this.audio.loop = true;
    Category[this.categoryID] == "frozen" ? this.audio.volume = 0.2 : this.audio.volume = 0.8;
    this.audio.load();
    this.audio.play();
  }
  /*For Play Music On Safari => Safari / Settings / Setting For This Website / Allow All Auto Play*/
  audioSucess: any;
  playSucess(url) {
    if (this.audioSucess) {
      this.audioSucess.pause();
      //this.audio = null;
    }
    else {
      this.audioSucess = new Audio();
    }
    this.audioSucess.src = "/assets/sounds/" + url;
    this.audioSucess.volume = 0.2;
    this.audioSucess.load();
    this.audioSucess.play();
  }

  getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
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

  public changeRoot(root: string) {
    this.cardList = new Array<FrozenPuzzle>();
    switch (root) {
      case "moana": {
        this.root = "moana";
        this.bgPath = "/assets/images/" + this.root + "/";
        this.bgImage = this.bgPath + "back.jpg"
        this.cardBgImage = this.bgPath + "cardBack.jpg";
        this.winImage = this.bgPath + "win2.jpg";

        this.soundRoot = "moana";
        this.soundExtension = ".mp3";
        this.categoryID = 2;
        this.soundMax = 6;
        this.ngOnInit();
        break;
      }
      case "frozen": {
        this.root = "frozen";
        this.bgPath = "/assets/images/" + this.root + "/";
        this.bgImage = this.bgPath + "back.jpg"
        this.cardBgImage = this.bgPath + "cardBack.jpg";
        this.winImage = this.bgPath + "win2.jpg";

        this.soundRoot = "";
        this.soundExtension = ".wav";
        this.categoryID = 1;
        this.soundMax = 9;
        this.ngOnInit();
        break;
      }
    }
  }
}