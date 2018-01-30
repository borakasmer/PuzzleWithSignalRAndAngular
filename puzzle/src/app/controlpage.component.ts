import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { HubConnection } from '@aspnet/signalr-client';
import 'rxjs/add/operator/switchMap';
import { PuzzleService } from '../Services/Indexservice';

@Component({
    selector: 'control_page',
    templateUrl: 'controlpage.component.html',
    styleUrls: ['./control.css']
})

export class ControlPageComponent implements OnInit {
    connectionID: string
    private _hubConnection: HubConnection;

    cardList: Array<FrozenPuzzle>
    bgImage: string = "/assets/images/frozen/controlback.jpg"
    cardBgImage: string = "/assets/images/frozen/controlCardback.png?ver=1.09";
    cardBgDisabledImage: string = "/assets/images/frozen/controlDisabledCardback.png";

    constructor(private route: ActivatedRoute, private service: PuzzleService) { }

    ngOnInit() {
        this.route.params.subscribe((params: Params) => {
            this.connectionID = params['connectionID'];
            console.log(this.connectionID);
        });

        this._hubConnection = new HubConnection("http://192.168.1.234:5000/puzzle?key=control");

        this._hubConnection
            .start()
            .then(() => {
                console.log("Hub_Connection Start!");
                //Eğer önce kartları çekmez isek Dictionary Liste'e Lock koymak lazım. Aynı key 2 kere yazılmaya çalışılıyor.
                //Get Cards 
                this.service.GetAllCards(this.connectionID).subscribe(result => {
                    var data=result.forEach(card => {
                        card.controlCardBgImage = this.cardBgImage;
                    });
                    console.log(JSON.stringify(data));
                    this.cardList = result //this.GroupTable(result, 3);
                },
                    err => console.log(err),
                    () => {
                        console.log("Card List Loaded");
                        this._hubConnection.invoke("TriggerMainPage", this.connectionID)
                            .then(result => {
                                console.log("MainPage Triggered");
                            });
                    }
                )
            })
            .catch(err => console.log('Error while establishing connection :('));
    }
    OpenCard(id) {
        console.log("Card Opening: " + id);
        /* console.log(this.cardList.filter(card=>card.id==id)); */
        var card = this.cardList.filter(card => card.id == id)[0];
        card.isShow = true;
        card.controlCardBgImage = this.cardBgDisabledImage;
        
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