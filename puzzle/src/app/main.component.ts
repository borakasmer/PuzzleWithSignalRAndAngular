import { Component, OnInit, ChangeDetectorRef, ElementRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HubConnection } from '@aspnet/signalr-client';
import { Console } from '@angular/core/src/console';
import { PuzzleService } from '../Services/Indexservice';
import { stringify } from '@angular/compiler/src/util';

declare var jquery: any;
declare var $: any;

enum Category {
  frozen = 1,
  moana = 2,
  plain=3
}
enum Command {
  right = 1,
  left = 2,
  up = 3,
  down = 4,
  stop = 5
}

@Component({
  selector: 'main_page',
  templateUrl: 'main.component.html',
  styleUrls: ['./main.css?ver=1.4']
})

export class MainComponent implements OnInit {

  root: string = "frozen";
  categoryID: number = 1;
  soundRoot: string = "";
  soundExtension: string = ".wav";
  soundMax: number = 9;
  moveCount = 0;

  showPlane: boolean = false;
  windowHeight: number = $(document).height();
  windowWidth: number = $(document).width()
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
  constructor(private service: PuzzleService, private cdRef: ChangeDetectorRef, private elementRef: ElementRef) { }

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

      if (this.categoryID != Category.plain) //Uçak Oyunu Değil İse
      {
        this.showPlane = false;
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

          this.moveCount = 0;
        },
          err => console.log(err),
          () => {
            console.log("Card List Loaded");
          }
        )
      }
      else {
        this.IsLogin = true;
        this.bgImage = this.bgPath + "back2.jpg"
        this.showPlane = true;
        var soundID = this.getRandomInt(2, this.soundMax);
        this.playAudio(soundID);
        setTimeout(() => {
          var wait = this.getRandomInt(500, 4000);
          this.createTank(wait);
        }
          , 2000); //En başta daha çıkacak tank zamanı
      }
    });

    this._hubConnection.on('OpenCard', (id: number) => {
      //Find Card
      var card = this.cardList.filter(card => card.id == id)[0];
      //Üst üste tıklanamasın
      if (!card.isShow) {
        this.moveCount += 1;
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
                    this.moveCount = 0;
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

    this._hubConnection.on('MovePlane', (command: string) => {
      if ($('#fightPlane').attr('src') == this.bgPath + "/plane.png") { //Vurulan Uçak Hareket etmesin.        
        switch (command) {
          case "right":
            {
              console.log("Move Right");
              var _top = $('#fightPlane').position().top;
              $('#fightPlane').clearQueue();
              $('#fightPlane').stop();
              $('#fightPlane').animate({
                top: _top,
                left: $(window).width() - 250
              }, (($(document).width() - 250 - $('#fightPlane').position().left) * 1800) / $(document).width() /*1500*/, "linear");
              break;
            }
          case "left":
            {
              console.log("Move Left");
              var _top = $('#fightPlane').position().top;
              $('#fightPlane').clearQueue();
              $('#fightPlane').stop();
              $('#fightPlane').animate({
                top: _top,
                left: 8
              }, ($('#fightPlane').position().left * 1800) / $(document).width()/*1500*/, "linear");
              break;
            }
          case "down":
            {
              console.log("Move Down");
              var _left = $('#fightPlane').position().left;
              $('#fightPlane').clearQueue();
              $('#fightPlane').stop();
              $('#fightPlane').animate({
                top: $(window).height() - 250,
                left: _left
              }, (($(document).height() - 250 - $('#fightPlane').position().top) * 1800) / $(document).height() /*1500*/, "linear");
              break;
            }
          case "up":
            {
              console.log("Move Up");
              var _left = $('#fightPlane').position().left;
              $('#fightPlane').clearQueue();
              $('#fightPlane').stop();
              $('#fightPlane').animate({
                top: 0,
                left: _left
              }, /*1500*/  //Aslında hareket mesafesine göre hızı dinamik olmalı          
                ($('#fightPlane').position().top * 1800) / $(document).height(), "linear");
              break;
            }
          case "stop":
            {
              console.log("Stop");
              $('#fightPlane').clearQueue();
              $('#fightPlane').stop();
              break;
            }
        }
      }
    });

    this._hubConnection.on('Fire', () => {
      console.log("FİREEE");
      var d1 = this.elementRef.nativeElement.querySelector('.divPlane');
      var pln = this.elementRef.nativeElement.querySelector('#fightPlane');
      console.log(pln.offsetLeft);
      console.log(pln.offsetTop)
      var timestamp = new Date().getUTCMilliseconds();
      var ths = this;
      d1.insertAdjacentHTML('beforeend', '<img src="' + this.bgPath + 'bomb.png" width="25px" class="bomb" style="position: absolute; top:' + (pln.offsetTop + 180) + 'px; left:' + (pln.offsetLeft + 125) + 'px" *ngIf="showPlane" id="' + timestamp + '"/>');
      $('#' + timestamp).animate({
        top: ($(document).height() - 50),
        left: pln.offsetLeft + 200
      },
        {
          //duration:1000
          //Aslında hareket mesafesine göre hızı dinamik olmalı          
          duration: (($(document).height() - pln.offsetTop) * 1300) / $(document).height(),
          step: function () {
            var pos = $(this).position();
            //console.log("Top Bomb_" + timestamp + ": ", pos.top);
            $(".tank").each(function (i) {
              //console.log("Tank_" + i + ": ", $(this).position().top);
              console.log("Bomb: " + pos.left * -1);
              console.log("Tank: " + $(this).width());

              console.log(ths.bgPath + "/explosion.png");
              if (pos.top * -1 <= $(this).position().top * -1 && pos.left * -1 <= $(this).position().left * -1 && pos.left * -1 >= ($(this).position().left * -1 - $(this).width())) {
                /* if (pos.top * -1 >= $(this).position().top * -1 && pos.top * -1 <= $(this).position().top * -1 + $(this).height && pos.left * -1 >= $(this).position().left * -1 && pos.left * -1 <= $(this).position().left * -1 + $(this).width) { */
                $(this).stop();
                $(this).attr('src', ths.bgPath + "/explosion.png");
                //Ateşlenmedi ise Bombasını yok et display=='none' ise 
                var bullet = $("#bullet_" + $(this).attr("id"))
                if (bullet.css('display') == 'none') {
                  bullet.remove();
                }
                //----------------

                setTimeout(() => {
                  ths.playSucess("bomb.mp3", 0.6);
                  $(".divTank #" + $(this).attr('id')).last().remove();
                }, 400)

              }
              //Herhangi bir tank her pixel'de vuruldu mu diye bak!

            });
          },
          specialEasing: {
            width: "linear",
            height: "linear"
          },
          complete: function () {
            $(".divPlane #" + timestamp).last().remove();
          }
        }
      );
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
  playSucess(url, vol: number = 0.2) {
    if (this.audioSucess) {
      this.audioSucess.pause();
      //this.audio = null;
    }
    else {
      this.audioSucess = new Audio();
    }
    this.audioSucess.src = "/assets/sounds/" + url;
    this.audioSucess.volume = vol;
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
      case "plane": {
        this.root = "plane";
        this.bgPath = "/assets/images/" + this.root + "/";
        this.bgImage = this.bgPath + "back.jpg"
        this.soundRoot = "plane";
        this.soundExtension = ".mp3";
        this.categoryID = 3;
        this.soundMax = 1;
        this.ngOnInit();
        break;
      }
    }
  }

  /*  LogCheckID:string=""; */
  isHit: boolean = false;
  public createTank(waitTime) {
    var ths = this;
    setTimeout(() => {
      var d1 = this.elementRef.nativeElement.querySelector('.divTank');
      var timestamp = new Date().getUTCMilliseconds();
      var timestampBullet = new Date().getUTCMilliseconds();
      //Tank
      d1.insertAdjacentHTML('beforeend', '<img src="' + this.bgPath + 'tank.gif" class="tank" style="position: absolute; top:' + ($(document).height() - 150) + 'px; left:' + ($(document).width() - 150) + 'px" *ngIf="showPlane" id="' + timestamp + '"/>');
      //Bullet
      d1.insertAdjacentHTML('beforeend', '<img src="' + this.bgPath + 'bullet4.png" class="bullet" style="position: absolute; display:none;  height:75px; top:' + ($(document).height() - 150) + 'px; left:' + ($(document).width() - 150) + 'px" id="bullet_' + timestampBullet + '"/>');

      //Tank
      $('.tank').animate({
        top: ($(document).height() - 150),
        left: 0
      }, 6000, "linear",
        function () {
          $(".divTank #" + timestamp).last().remove();
        }
      );

      //Bullet
      $('.bullet').animate({
        top: ($(document).height() - 150),
        left: 0
      }, 6000, "linear",
        function () {
          $(".divTank #" + timestampBullet).last().remove();
        }
      );
      //Tank Yukarı Doğru Ateş Etsin
      var waitBullet = ths.getRandomInt(1000, 8000);
      if (waitBullet < 6000) {//Tank Duvarı geçmiş ise hiç ateş etmesin. Duvara kadar en fazla 6sn sürüyor.
        setTimeout(() => {
          $("#bullet_" + timestampBullet).css('display', 'inline')
          var _left = $("#bullet_" + timestampBullet).position().left;

          $("#bullet_" + timestampBullet).clearQueue();
          $("#bullet_" + timestampBullet).stop();

          $("#bullet_" + timestampBullet).animate({
            top: 0,
            left: _left
          },
            {
              duration: 9000,
              specialEasing: {
                width: "linear",
                height: "linear"
              },
              step: function () { //Her bombanın hareketinde uçağu vurdumu diye bakılır.
                var pos = $(this).position();

                /* if(ths.LogCheckID=="" || ths.LogCheckID==$(this).attr("id"))// Sadece 1 kerelik loglama amaçlı ...
                {                       
                  ths.LogCheckID = $(this).attr("id");                
                  console.log("Bomb_" + $(this).attr("id") + "_Top:" + pos.top);
                  console.log("Flight" + $(this).attr("id") + "_TopDown:" + ($('#fightPlane').position().top  + $('#fightPlane').height()));
                  console.log("Flight" + $(this).attr("id") + "_Top:" + $('#fightPlane').position().top);
                  console.log("Bomb_" + $(this).attr("id") + "Left:" + pos.left);
                  console.log("Flight" + $(this).attr("id") + "_Left:" + $('#fightPlane').position().left);
                  console.log("Flight" + $(this).attr("id") + "_LeftDown:" + ($('#fightPlane').position().left + $('#fightPlane').width()));
                } */

                //Bombo uçağı vurursa
                if (pos.top <= $('#fightPlane').position().top + $('#fightPlane').height() && pos.top >= $('#fightPlane').position().top &&
                  pos.left >= $('#fightPlane').position().left && pos.left <= ($('#fightPlane').position().left + $('#fightPlane').width()) && ths.isHit == false) {
                  ths.isHit = true;  // animate sırasında aynı yere tekrardan girmesin diye. (Lock) object.
                  $('#fightPlane').stop(); // Hareketli ise dursun               
                  $('#fightPlane').attr('src', ths.bgPath + "/explosion.png");
                  ths.playSucess("bomb.mp3", 0.6);

                  setTimeout(() => {
                    //Reset Plane Game Page    
                    $(".tank").remove();
                    $(".bullet").remove();

                    $('#fightPlane').attr('src', ths.bgPath + "/plane.png");
                    var soundID = ths.getRandomInt(2, ths.soundMax)
                    ths.playAudio(soundID);
                    $('#fightPlane').css('left', 0);
                    $('#fightPlane').css('top', 0);
                    return;
                    //-----------------------                
                  }, 1000)
                }
              },
              complete: function () {
                $("#bullet_" + timestampBullet).remove();
                ths.isHit=false; // lock'ı kaldırdık.
              }
            }
          );
        }, waitBullet)
      }
      //----------------

      //Yeni Tank Oluştur
      setTimeout(() => {
        var wait = ths.getRandomInt(500, 4000);
        ths.createTank(wait);
      }, 400)
    }, waitTime)
  }
}