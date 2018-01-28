class FrozenPuzzle {

    private _ID: number;
    public get ID(): number {
        return this._ID;
    }
    public set ID(v: number) {
        this._ID = v;
    }

    private _Name: string;
    public get Name(): string {
        return this._Name;
    }
    public set Name(v: string) {
        this._Name = v;
    }

    private _RefCategoryID: number;
    public get RefCategoryID(): number {
        return this._RefCategoryID;
    }
    public set RefCategoryID(v: number) {
        this._RefCategoryID = v;
    }

    private _IsShow: boolean = false;
    public get IsShow(): boolean {
        return this._IsShow;
    }
    public set IsShow(v: boolean) {
        this._IsShow = v;
    }

}
