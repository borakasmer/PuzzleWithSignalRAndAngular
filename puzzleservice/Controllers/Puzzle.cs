using System;
using System.IO;
using System.Net;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using SixLabors.ImageSharp;

public class Puzzle : Hub
    {
         public override Task OnConnectedAsync(){
            Guid imgName = Guid.NewGuid();
            var barcode=CreateBarcode(Context.ConnectionId,imgName);           
            return Clients.Client(Context.ConnectionId).InvokeAsync("GetConnectionId",barcode,Context.ConnectionId,imgName);
        } 

        public string CreateBarcode(string connectionID,Guid imgName)
        {
            string Code = "http://192.168.1.234:4200/ControlPage/" + connectionID;
            string width = "200";
            string height = "200";
            var url = string.Format($"http://chart.apis.google.com/chart?cht=qr&chs={width}x{height}&chl={Code}");
            WebRequest request = WebRequest.Create(url);
            WebResponse response = request.GetResponse();
            Stream stream = response.GetResponseStream();
            var image=Image.Load(stream);                                   
                        
            image.Save("wwwroot/images/" + imgName + ".png");
            return "http://192.168.1.234:5000/images/" + imgName + ".png";
        }
        public void DeleteImage(string imgName)
        {            
            File.Delete("wwwroot/images/"+ imgName + ".png");
        }

        public Task TriggerMainPage(string connectionID)
        {
             return Clients.Client(connectionID).InvokeAsync("Connected",connectionID);
        }
    }
