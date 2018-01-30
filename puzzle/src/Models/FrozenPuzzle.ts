class FrozenPuzzle {

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

    private _RefCategoryID: number;
    public get refCategoryID(): number {
        return this._RefCategoryID;
    }
    public set refCategoryID(v: number) {
        this._RefCategoryID = v;
    }

    private _IsShow: boolean = false;
    public get isShow(): boolean {
        return this._IsShow;
    }
    public set isShow(v: boolean) {
        this._IsShow = v;
    }

    
    private _controlCardBgImage : string;
    public get controlCardBgImage() : string {
        return this._controlCardBgImage;
    }
    public set controlCardBgImage(v : string) {
        this._controlCardBgImage = v;
    }
    
}
