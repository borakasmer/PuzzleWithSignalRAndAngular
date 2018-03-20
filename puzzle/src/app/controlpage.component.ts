import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { HubConnection } from '@aspnet/signalr-client';
import { PuzzleService } from '../Services/Indexservice';


enum Category {
    frozen = 1,
    moana = 2,
    plane = 3
}

@Component({
    selector: 'control_page',
    templateUrl: 'controlpage.component.html',
    styleUrls: ['./control.css']
})

export class ControlPageComponent implements OnInit {
    root: string = "frozen";
    categoryID: number = 1;
    connectionIDMainPage: string;
    _connectionId: string;
    side: string = '';
    private _hubConnection: HubConnection;

    cardList: Array<FrozenPuzzle>
    /* bgPath = "/assets/images/frozen/"; */
    bgPath = "/assets/images/" + this.root + "/";
    servicePath = "http://192.168.1.234:5000/";
    bgImage: string = this.bgPath + "controlback.jpg"
    cardBgImage: string = this.bgPath + "controlCardback.png?ver=1.09";
    cardBgDisabledImage: string = this.bgPath + "controlDisabledCardback.png";

    isPlane: boolean;

    _tiltLR: number;
    _tiltFB: number
    _direction: number;

    constructor(private route: ActivatedRoute, private service: PuzzleService) { }

    ngOnInit() {
        this.route.params.subscribe((params: Params) => {
            this.connectionIDMainPage = params['connectionID']; //MainPageConnectionID
            this.categoryID = params['categoryID'];
            this.SetCategoryParameters(Category[this.categoryID]);
            console.log("MainPageConnectionID:" + this.connectionIDMainPage);
        });

        this._hubConnection = new HubConnection(this.servicePath + "puzzle?key=control");

        this._hubConnection
            .start()
            .then(() => {
                console.log("Hub_Connection Start!");
                if (this.categoryID != Category.plane) //Uçak Oyunu Değil İse
                {
                    //Eğer önce kartları çekmez isek Dictionary Liste'e Lock koymak lazım. Aynı key 2 kere yazılmaya çalışılıyor.
                    //Get Cards 
                    this.service.GetAllCards(this.connectionIDMainPage, this.categoryID).subscribe(result => {
                        var data = result.forEach(card => {
                            card.controlCardBgImage = this.cardBgImage;
                        });
                        console.log(JSON.stringify(data));
                        this.cardList = result //this.GroupTable(result, 3);
                    },
                        err => console.log(err),
                        () => {
                            console.log("Card List Loaded");
                            this._hubConnection.invoke("TriggerMainPage", this.connectionIDMainPage, this._connectionId)
                                .then(result => {
                                    console.log("MainPage Triggered");
                                });
                        }
                    )
                }
                else {
                    this.isPlane = true;
                    this._hubConnection.invoke("TriggerMainPage", this.connectionIDMainPage, this._connectionId)
                        .then(result => {
                            console.log("MainPage Triggered");
                            this.startPlane();
                        });
                }
            })
            .catch(err => console.log('Error while establishing connection :('));

        this._hubConnection.on('GetConnectionId', (connectionId: string) => {
            this._connectionId = connectionId;
            console.log("ConnectionID :" + this._connectionId);
        });

        this._hubConnection.on('NotifyControlPage', (id: number, result: boolean, isReset: boolean = false) => {
            if (isReset) {
                //Get Cards 
                this.service.GetAllCards(this.connectionIDMainPage, this.categoryID).subscribe(result => {
                    var data = result.forEach(card => {
                        card.controlCardBgImage = this.cardBgImage;
                    });
                    console.log(JSON.stringify(data));
                    this.cardList = result //this.GroupTable(result, 3);
                },
                    err => console.log(err),
                    () => {
                        console.log("Card List Reset");
                    }
                )
            }
            else if (result) {
                this.cardList.filter(cd => cd.isShow && cd.isDone == false).forEach(f => {
                    f.controlCardBgImage = this.cardBgDisabledImage;
                    f.isDone = true;
                })
            }
            else {
                setTimeout(() =>
                    this.cardList.filter(cd => cd.isShow == true && cd.isDone == false).forEach(f => {
                        f.controlCardBgImage = this.cardBgImage;
                        f.isShow = false;
                        f.isDone = false;
                    }), 1000)
            }
        });

    }
    //ilerde Categorylere göre farklılaştırma yapılabilir.
    SetCategoryParameters(category: string) {
        switch (category) {
            case "moana": {
                this.bgPath = "/assets/images/" + category + "/";
                this.bgImage = this.bgPath + "controlback.jpg"
                this.cardBgImage = this.bgPath + "controlCardback.png?ver=1.09";
                this.cardBgDisabledImage = this.bgPath + "controlDisabledCardback.png";
                break;
            }
            case "frozen": {
                this.bgPath = "/assets/images/" + category + "/";
                this.bgImage = this.bgPath + "controlback.jpg"
                this.cardBgImage = this.bgPath + "controlCardback.png?ver=1.09";
                this.cardBgDisabledImage = this.bgPath + "controlDisabledCardback.png";
                break;
            }
            case "plane": {
                this.bgPath = "/assets/images/" + category + "/";
                this.bgImage = this.bgPath + "controlback.jpg"
                break;
            }
        }
    }
    OpenCard(id) {
        if (this.cardList.filter(cd => cd.isShow && cd.isDone == false).length < 2) {
            /* console.log(this.cardList.filter(card=>card.id==id)); */
            var card = this.cardList.filter(card => card.id == id)[0];
            //Üst üste tıklanamasın
            if (!card.isShow) {
                card.isShow = true;
                card.controlCardBgImage = this.cardBgDisabledImage;

                this._hubConnection.invoke("OpenCard", this.connectionIDMainPage, id)
                    .then(result => {
                        console.log("Command MainPage OpenCard");
                    });
            }
        }
    }

    //| pairs filter kullanıldığı için artık bu method kullanılmamaktadır.
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

    public Fire() {
        this._hubConnection.invoke("Fire", this.connectionIDMainPage)
            .then(result => {
                console.log("MainPage Fired");
            });
    }
    public startPlane() {
        var ths = this;
        window.addEventListener("deviceorientation", function (eventData) {
            var tiltLR = eventData.gamma;
            var tiltFB = eventData.beta;
            var direction = eventData.alpha;

            ths._tiltLR = Math.round(tiltLR);
            ths._tiltFB = Math.round(tiltFB);
            ths._direction = Math.round(direction);

            //Yönlendirme
            /* if (ths._tiltLR > 8 && ths.side != 'right' && ths.side != 'down' && ths.side != 'up') { */
            //Amaç Right'a Giderken aynı zamanda başka bir yöne Down veya Up'a daha çok çekilir ise o yönde gider.
            if (ths._tiltLR > 8 && ths.side != 'right' && (ths._tiltLR - 8) > (ths._tiltFB - 8) && (ths._tiltLR - 8) > (ths._tiltFB * -1 - 8)) {
                ths.side = 'right';
                ths._hubConnection.invoke("MovePlane", ths.side, ths.connectionIDMainPage)
                    .then(result => {
                        console.log("Move Right Post");
                    });
            }
            /* else if (ths._tiltLR < -8 && ths.side != 'left' && ths.side != 'down' && ths.side != 'up') { */
            //Amaç Left'e Giderken aynı zamanda başka bir yöne Down veya Up'a daha çok çekilir ise o yönde gider.
            else if (ths._tiltLR < -8 && ths.side != 'left' && (ths._tiltLR * -1 - 8) > (ths._tiltFB - 8) && (ths._tiltLR * -1 - 8) > (ths._tiltFB * -1 - 8)) {
                ths.side = 'left';
                ths._hubConnection.invoke("MovePlane", ths.side, ths.connectionIDMainPage)
                    .then(result => {
                        console.log("Move Left Post");
                    });
            }
            /* else if (ths._tiltFB > 8 && ths.side != 'down') { */
            //Amaç Down'a Giderken aynı zamanda başka bir yöne Left veya Right'a daha çok çekilir ise o yönde gider.
            else if (ths._tiltFB > 8 && ths.side != 'down' && (ths._tiltFB - 8) > (ths._tiltLR - 8) && (ths._tiltFB - 8) > (ths._tiltLR * -1 - 8)) {
                ths.side = 'down';
                ths._hubConnection.invoke("MovePlane", ths.side, ths.connectionIDMainPage)
                    .then(result => {
                        console.log("Move Down Post");
                    });
            }
            /* else if (ths._tiltFB < -8 && ths.side != 'up') { */
            //Amaç Up'a Giderken aynı zamanda başka bir yöne Left veya Right'a daha çok çekilir ise o yönde gider.  
            else if (ths._tiltFB < -8 && ths.side != 'up' && (ths._tiltFB * -1 - 8) > (ths._tiltLR - 8) && (ths._tiltFB * -1 - 8) > (ths._tiltLR * -1 - 8)) {
                ths.side = 'up';
                ths._hubConnection.invoke("MovePlane", ths.side, ths.connectionIDMainPage)
                    .then(result => {
                        console.log("Move Up Post");
                    });
            }
            else if (ths._tiltLR > -8 && ths._tiltLR < 8 && ths._tiltFB > -8 && ths._tiltFB < 8 && ths.side != 'stop') {
                ths.side = 'stop';
                ths._hubConnection.invoke("MovePlane", ths.side, ths.connectionIDMainPage)
                    .then(result => {
                        console.log("Move Stop Post");
                    });
            }
            //------------------------------------------

            var logo = document.getElementById("imgLogo");
            logo.style.webkitTransform = "rotate(" + tiltLR + "deg) rotate3d(1,0,0, " + (tiltFB * -1) + "deg)";
            //logo.style.MozTransform = "rotate(" + tiltLR + "deg)";
            logo.style.transform = "rotate(" + tiltLR + "deg) rotate3d(1,0,0, " + (tiltFB * -1) + "deg)";
        }, false);

    }
}