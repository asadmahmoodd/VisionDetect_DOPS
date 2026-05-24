from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, File, UploadFile
from contextlib import asynccontextmanager
from ultralytics import YOLO
from PIL import Image
import io

model=None

@asynccontextmanager
async def lifespan(app):
    global model
    model=YOLO("yolov8n.pt")
    print("model loaded...")
    yield

app=FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173","http://localhost","http://13.206.221.113"],
    allow_methods=["*"],
    allow_headers=["*"]
)


@app.post("/predict")
async def predictBox(file:UploadFile=File(...)):
    print(f"File Recieved {file.filename}")

    content=await file.read()
    try:
        image=Image.open(io.BytesIO(content))
    except Exception as e:
        return{"image-error":e,
               "error":"file not supported"}

    results=model(image)

    Jsondata=BoxCordinates(results[0].boxes.data,results[0].names)
    print(Jsondata)
    return{
        "message":"image processed",
        "result": Jsondata
        }


def BoxCordinates(r,names):
    detection=[]
    for i in range(len(r)):
        data=r[i]
        dets={
            "x1": round(data[0].item()),
            "y1": round(data[1].item()),
            "x2": round(data[2].item()),
            "y2": round(data[3].item()),
            "confidence": round(data[4].item(),4),
            "label": names[int(data[5].item())]
        }

        detection.append(dets)
    
    return detection
    
    
    