const Sample_Amount = 15;//采样点的数量
const Box_Width = 200;//AABB盒目标边长

var startPoint = [],samplingPoint = new Array(Sample_Amount);//初始点集与采样点集

var h1 = document.querySelector(".answer");
var canvas = document.querySelector(".canvas");
var cxk = canvas.getContext("2d");

//1.鼠标画线并记录原始点
var isMouseDown = false;

var lastpos;//上一次触发时的位置

let handlemousemove = e => {
    if (!isMouseDown) return;
    var curpos = [e.offsetX,e.offsetY];
    
    cxk.beginPath();

    //记录原始点
    //cxk.arc(...curpos,3,0,2*Math.PI);
    startPoint.push(curpos);

    //绘制线段
    cxk.moveTo(...lastpos);
    cxk.lineTo(...curpos);

    cxk.closePath();

    cxk.fillStyle = "#000000"
    cxk.strokeStyle = "#000000";
    cxk.fill();
    cxk.stroke();

    lastpos = [e.offsetX,e.offsetY];
}

canvas.onmouseleave = () =>{
    isMouseDown = false;
}
let handleMouseDown = e => {
    isMouseDown = true;
    //初始点记录
    lastpos = [e.offsetX,e.offsetY];
    startPoint.unshift(lastpos)
    //采样点记录
    samplingPoint[0] = lastpos;
}

let handleMouseUp = e => {
    isMouseDown = false;
    //采样点记录
    let lastpos = [e.offsetX,e.offsetY];
    startPoint.push(lastpos);
    samplingPoint[Sample_Amount - 1] = lastpos;
    Sampling()
}

let reset = () => {
    location = location;
}

canvas.onmousemove = e => handlemousemove(e);//鼠标
canvas.onmouseup = e => handleMouseUp(e);
canvas.onmousedown = e => handleMouseDown(e);

canvas.ontouchstart = e => handleMouseDown(e);
canvas.ontouchmove = e => handlemousemove(e);
canvas.ontouchend = e => handleMouseUp(e);

//2.计算采样点
function Sampling() {
    const unit = findPollineLength(startPoint) / (Sample_Amount - 1);
    let curLength = 0;//已经记录的距离
    let flag = 0;//已经填充的编号

    let newPoint;//新的点

    for (let i = 0;i < startPoint.length - 1;i++){
        let partLength = findPointDistance(startPoint[i],startPoint[i + 1]);
        
        if (curLength + partLength >= unit){
            let ratio = (unit - curLength) / partLength;
            let newX = startPoint[i][0] + ratio * (startPoint[i + 1][0] - startPoint[i][0])
            let newY = startPoint[i][1] //纵坐标不到为啥老出BUG，删了效果反而更好，就删了

            newPoint = [ newX , newY ]
            
            flag ++;
            samplingPoint[flag] = newPoint;
            curLength = 0;
        }
        else
        {
            curLength += partLength;
        }
    }

    if (flag < 5){//小于5默认误触
        samplingPoint = [];
        startPoint = [];
        return;
    }

    while (flag < Sample_Amount - 2) {//实在不知道为啥数对不上了，摆了
        newPoint = findMiddlePoint([samplingPoint[flag],samplingPoint[Sample_Amount - 1]]);
        flag ++;
        samplingPoint[flag] = newPoint;
    }

    Normalizating(samplingPoint);
    
    samplingPoint = [];
    startPoint = [];
}

function Normalizating(points){//3.标准化
    let scale = Box_Width / findLimitingNum(points)
    
    points.forEach(p => {//缩放
        p[0] *= scale;
        p[1] *= scale;
    })

    let middlePoint = findMiddlePoint(points);//中心点
    //计算偏移量
    let delX = canvas.width / 2 - middlePoint[0];
    let delY = canvas.height / 2 - middlePoint[1];

    points.forEach(p => {//平移
        p[0] += delX;
        p[1] += delY;
    })

    Comparing(points);
}

let multiStroke = null;//多笔字

//4.比较
function Comparing(points){
    let unitVector = findVectorLength(points);

    let similarity = new Array();//记录结果
    let keys = new Array();
    for (let key in typicalSamples) {
        similarity.push(findCosineValue(unitVector,typicalSamples[key]))
        keys.push(key)
    }

    var number = keys[similarity.indexOf(Math.max(...similarity))]

    number = multiStroke ? multiStroke : number;

    //多笔字检测
    if (number == "5f" || number == "4f"){
        multiStroke = number.charAt(0)
    }
    else{
        h1.innerHTML += number.charAt(0);//完结撒花！！！

        multiStroke = null;
    }
}