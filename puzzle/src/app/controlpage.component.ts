import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { HubConnection } from '@aspnet/signalr-client';
import 'rxjs/add/operator/switchMap';

@Component({
    selector: 'control_page',
    templateUrl: 'controlpage.component.html'
})

export class ControlPageComponent implements OnInit {
    connectionID: number
    private _hubConnection: HubConnection;

    constructor(private route: ActivatedRoute) { }

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
                this._hubConnection.invoke("TriggerMainPage", this.connectionID)
                .then(result => {
                  console.log("MainPage Triggered");
                });
                
            })
            .catch(err => console.log('Error while establishing connection :('));
    }
}