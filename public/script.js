console.log('canvas is running');

var canvas = document.getElementById('canvas');
 // try {
   if (canvas.getContext) {
     var context = canvas.getContext('2d');
   } else {
     alert("Your browser does not support <canvas> element")
}


 $('#canvas').on("mousedown", function(e) {
   console.log('mousedown firing');
     if (e.target === document.querySelector("#canvas")) {
         (function (context) {
             context.beginPath();
         }(context));
         $(document).on("mousemove.draw", function(e){
           console.log('mousemove firing');
             e.preventDefault();
             (function(context) {
                 context.strokeStyle = 'black';
                 context.lineTo(e.pageX - canvas.offsetLeft, e.pageY-canvas.offsetTop);
                 console.log(e.pageX - canvas.offsetLeft, e.pageY-canvas.offsetTop);
                 context.stroke();
             }(context));
         })
         $(document).on("mouseup.draw", function(e){
           console.log('mousup firing');
             $(document).off("mousemove.draw");
             $(document).off("mouseup.draw");
             let signImg = canvas.toDataURL();
             $("#sign").val(signImg);
         })
     }
 })

 $('#resetsig').on('click', function(e) {
     context.clearRect(0, 0, canvas.width, canvas.height);
     $("#sign").val(signImg);
 })



 // $('#reset2').on('click', function(e) {
 //     context.clearRect(0, 0, canvas.width, canvas.height);
 //     $("#sign").val('');
 // })
