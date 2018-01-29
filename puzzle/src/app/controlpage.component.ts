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
                    console.log(JSON.stringify(result));
                    this.cardList = result
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
}