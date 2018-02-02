import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { HubConnection } from '@aspnet/signalr-client';
import 'rxjs/add/operator/switchMap';
import { PuzzleService } from '../Services/Indexservice';
import { isRegExp } from 'util';

@Component({
    selector: 'control_page',
    templateUrl: 'controlpage.component.html',
    styleUrls: ['./control.css']
})

export class ControlPageComponent implements OnInit {
    connectionIDMainPage: string;
    _connectionId: string;
    private _hubConnection: HubConnection;

    cardList: Array<FrozenPuzzle>
    bgPath = "/assets/images/frozen/";
    servicePath = "http://192.168.1.234:5000/";
    bgImage: string = this.bgPath + "controlback.jpg"
    cardBgImage: string = this.bgPath + "controlCardback.png?ver=1.09";
    cardBgDisabledImage: string = this.bgPath + "controlDisabledCardback.png";

    constructor(private route: ActivatedRoute, private service: PuzzleService) { }

    ngOnInit() {
        this.route.params.subscribe((params: Params) => {
            this.connectionIDMainPage = params['connectionID']; //MainPageConnectionID
            console.log("MainPageConnectionID:" + this.connectionIDMainPage);
        });

        this._hubConnection = new HubConnection(this.servicePath + "puzzle?key=control");

        this._hubConnection
            .start()
            .then(() => {
                console.log("Hub_Connection Start!");
                //Eğer önce kartları çekmez isek Dictionary Liste'e Lock koymak lazım. Aynı key 2 kere yazılmaya çalışılıyor.
                //Get Cards 
                this.service.GetAllCards(this.connectionIDMainPage).subscribe(result => {
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
            })
            .catch(err => console.log('Error while establishing connection :('));

        this._hubConnection.on('GetConnectionId', (connectionId: string) => {
            this._connectionId = connectionId;
            console.log("ConnectionID :" + this._connectionId);
        });

        this._hubConnection.on('NotifyControlPage', (id: number, result: boolean, isReset: boolean = false) => {
            if (isReset) {
                //Get Cards 
                this.service.GetAllCards(this.connectionIDMainPage).subscribe(result => {
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
}