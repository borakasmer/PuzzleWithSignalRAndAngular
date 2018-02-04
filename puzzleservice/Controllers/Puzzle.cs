using System;
using System.IO;
using System.Net;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using SixLabors.ImageSharp;

public class Puzzle : Hub
{
    string servicePath = "http://192.168.1.234";
    public override Task OnConnectedAsync()
    {
        // Boolean IsMain = Context.Connection.GetHttpContext().Request.Headers["Host"].ToString().Contains("localhost");
        string FromPage = this.Context.Connection.GetHttpContext().Request.Query["key"];
        //var result = Context.Connection.GetHttpContext().Request.Headers.Values;
        //if (IsMain)
        if (FromPage == "main")
        {
            //Main Page
            Guid imgName = Guid.NewGuid();
            return Clients.Client(Context.ConnectionId).InvokeAsync("GetConnectionId", Context.ConnectionId, imgName);
        }
        else
        {
            //Control Page
            return Clients.Client(Context.ConnectionId).InvokeAsync("GetConnectionId", Context.ConnectionId);
        }
    }

    //Barcode alınması OnConnectedAsync() kaldırıldı. Çünkü seçilen categoryID alınamıyordu.
    //Bu method MainPage tarafında GetConnectionId() methodu  tarafından çağrılır.
    public string CreateBarcode(string connectionID, Guid imgName, int categoryID)
    {
        string Code = servicePath + ":4200/ControlPage/" + connectionID + "/" + categoryID;
        string width = "200";
        string height = "200";
        var url = string.Format($"http://chart.apis.google.com/chart?cht=qr&chs={width}x{height}&chl={Code}");
        WebRequest request = WebRequest.Create(url);
        WebResponse response = request.GetResponse();
        Stream stream = response.GetResponseStream();
        var image = Image.Load(stream);

        image.Save("wwwroot/images/" + imgName + ".png");
        return servicePath + ":5000/images/" + imgName + ".png";
    }
    public void DeleteImage(string imgName)
    {
        File.Delete("wwwroot/images/" + imgName + ".png");
    }

    public Task TriggerMainPage(string connectionIDMainPage, string connectionIDControlPage)
    {
        return Clients.Client(connectionIDMainPage).InvokeAsync("Connected", connectionIDControlPage);
    }

    public Task OpenCard(string connectionID, int ID)
    {
        return Clients.Client(connectionID).InvokeAsync("OpenCard", ID);
    }

    public Task NotifyControlPage(string controlConnectionID, int ID, bool result, bool isReset = false)
    {
        return Clients.Client(controlConnectionID).InvokeAsync("NotifyControlPage", ID, result, isReset);
    }
}
