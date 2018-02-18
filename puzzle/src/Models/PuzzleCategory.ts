class PuzzleCategory{
    
    private _ID: number;
    public get id(): number {
        return this._ID;
    }
    public set id(v: number) {
        this._ID = v;
    }

    private _Name: string;
    public get name(): string {
        return this._Name;
    }
    public set name(v: string) {
        this._Name = v;
    }

    
    private _BgColor : string;
    public get BgColor() : string {
        return this._BgColor;
    }
    public set BgColor(v : string) {
        this._BgColor = v;
    }

    
    private _MenuImage : string;
    public get MenuImage() : string {
        return this._MenuImage;
    }
    public set MenuImage(v : string) {
        this._MenuImage = v;
    } 
}