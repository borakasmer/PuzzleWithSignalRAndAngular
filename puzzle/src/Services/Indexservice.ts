import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

@Injectable()
export class PuzzleService {
    constructor(private http: Http) { }
    public GetAllCards(connectionID:string,isReset:boolean=false) {
        /* return this.http.get("http://localhost:5000/api/Puzzles/1") */
        return this.http.get("http://192.168.1.234:5000/api/Puzzles/1/"+connectionID+"/"+isReset)
        .map(result => result.json());
    }
}