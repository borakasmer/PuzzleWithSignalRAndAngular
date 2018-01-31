using System;

[Serializable]
public class FrozenPuzzle : Ipuzzle
{
    public int ID { get; set; }
    public string Name { get; set; }
    public int RefCategoryID { get; set; }
    public bool IsShow { get; set; }
    public string ControlCardBgImage { get; set; }
    public bool IsDone { get; set; }
}