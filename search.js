//Ubicacion de la planilla dentro de los archivos de WP
var file_path = "http://www.oai.usm.cl/wp-content/uploads/2019/03/planilla.xlsx";

//Se formatean los datos de la planilla para ser utilizados por el codigo.
function prepareData(data){
  data.forEach(element => {
    element[0] = [element[0]];//Esto se hace para generalizar la funcion getAll y filterBy
    if (element[5] != undefined){
      element[5] = element[5].split(/,|;/);//Las carreras para cada destino quedaran en forma de arreglo
      element[5].forEach((carrera, index, carreras) =>{
        carreras[index] = carrera.replace(/^\s+|\s+$/g, '');
      });
    }
  });
}

function getArrayText(array){
  return array.join();
}

//Se devuelve un arreglo con todos los datos de la columna 'column_number (no repetidos)'
function getAll(data, column_number){
  var results = [];
  data.forEach(element => {
    if(element[column_number] != undefined){
      element[column_number].forEach(item => {
        if(!results.includes(item)){
          results.push(item);
        }
      });
    }
  });
  return results;
}

//Se devuelve un arreglo con todos los destinos (filas) que en la columna 'column_number' incluye el el elemento 'value'
function filterBy(data, value, column_number){
  var results = [];
  if(value == "0"){//Si se selecciona todos los paises se devuelven todos los destinos
    results = [...data];
    return results; 
  }
  data.forEach(element => {
    if(element[column_number].includes(value)){
      results.push(element);
    }
  });
  return results;
}

//Se limpian los resultados obtenidos por el boton search para mostrar posteriormente un nueva busqueda
function resetResults(){
  var results = document.querySelectorAll("#results li");
  results.forEach(element => {
    element.parentNode.removeChild(element);
  });

}

/*Se construye la  caja de visualizacion (modal) de un destino en particular
  Esta funcion, como gran parte del buscador, es muy dependiente de Bootstrap*/
function buildModal(row, cupos_caption){//Se recibe la fila (destino) a visualizar y los semestres correspondientes a los cupos
  var modalTitle = document.querySelector(".modal-title");
  modalTitle.innerText = row[1];

  /*---Cupos---*/
  document.querySelector(".modal-body #CT1").innerText = cupos_caption[0];
  document.querySelector(".modal-body #CT2").innerText = cupos_caption[1];
  document.querySelector(".modal-body #CT3").innerText = cupos_caption[2];

  document.querySelector(".modal-body #CP1").innerText = row[2];
  document.querySelector(".modal-body #CP2").innerText = row[3];
  document.querySelector(".modal-body #CP3").innerText = row[4];
  /*-----------*/

  var i = document.querySelector(".modal-body #PA");//Pais
  i.innerText = row[0];
  var i = document.querySelector(".modal-body #EP");//Estudios Permitidos
  i.innerText = row[5];
  var i = document.querySelector(".modal-body #RE");//Requisitos especiales
  i.innerText = row[7] == undefined? "Sin requisitos" : row[7];
  var i = document.querySelector(".modal-body #OB");//Observaciones
  i.innerText = row[9] == undefined? "Sin observaciones" : row[9];
  var i = document.querySelector(".modal-body #BE");//Becas
  i.innerText = row[8] == undefined? "No hay becas" : row[8];

  var i = document.querySelector(".modal-body #OA");//Oferta Academica
  i.setAttribute("href", row[10] == undefined? "" : row[10]);

  var i = document.querySelector(".modal-body #OA2");//Oferta Academica #2
  i.setAttribute("href", row[11] == undefined? "" : row[11]);
}


//Peticion GET del archivo
var req = new XMLHttpRequest();
req.open("GET", file_path, true);
req.responseType = "arraybuffer";

req.onload = function(e) {

  /*---Obtencion de los datos de la planilla---*/ 
  var data = new Uint8Array(req.response);
  var workbook = XLSX.read(data, {type:"array"});
  var name = workbook.SheetNames[0];
  var worksheet = workbook.Sheets[name];
  var dataRows = XLSX.utils.sheet_to_json(worksheet, {header:1});
  /*-------------------------------------------*/
  

  var cupos_caption = dataRows[7].slice(2,5);//Semestres correspondientes a los cupos a mostrar 
  dataRows = dataRows.slice(8);//Los destinos parten desde la fila 8

  
  prepareData(dataRows);
  /*---Construccion de los selectores de carrera y pais---*/
  var countries = getAll(dataRows, 0);
  var countrySelect = document.querySelector("#countrySelect");
  countries.forEach(element => {//Se rellena el selector con los paises obtenidos desde la planilla
    var option = document.createElement("option");
    option.text = element;
    option.value = element;
    countrySelect.add(option);
  })
  var carreras = getAll(dataRows, 5);
  carreras.splice(carreras.indexOf('Todos'), 1 );//Se elimina del selector ya que esta opcion solo participa en la logica de busqueda
  carreras.splice(carreras.indexOf('Ingeniería'), 1 );//Lo mismo que la linea anterior
  carreras.sort()
  carreras.push('Otras carreras');//Se agrega como opcion extra
  var carreraSelect = document.querySelector("#carreraSelect");
  carreras.forEach(element => {//Se rellena el selector con las carreras obtenidas desde la planilla
    var option = document.createElement("option");
    option.text = element;
    option.value = element;
    carreraSelect.add(option);
  })
  /*------------------------------------------------------*/

  
  /*------Logica de busqueda------*/
  document.getElementById("searchButton").addEventListener("click", function(){//Al clikear el boton 'Buscar'
    resetResults();

    var countrySelect = document.querySelector("#countrySelect");
    var country = countrySelect.options[countrySelect.selectedIndex].value;
    var results = filterBy(dataRows, country, 0);//Se filtran las filas (destinos) segun el pais seleccionado en el selector
    var carreraSelect = document.querySelector("#carreraSelect");
    var carrera = carreraSelect.options[carreraSelect.selectedIndex].value;
    //Los filtros posteriores se realizan sobre los destinos ya filtrados por pais
    var todos = filterBy(results, 'Todos', 5);//Se filtran todos los destinos con 'Todos' como carrera
    var ingenierias = filterBy(results, 'Ingenierí­a', 5);//Se filtran todos los destinos con 'Ingeniería' como carrera
    var tecnicas = filterBy(results, 'Carreras Técnicas', 5);//Se filtran todos los destinos con 'Carreras Tecnicas' como carrera

    //Se filtran todos los destinos que incluyan la carrera seleccionada en el selector.
    //Luego se le concatenan los destinos marcados con 'Todos'
    results = filterBy(results, carrera, 5).concat(todos);

    if(carrera.includes("Ing.")){//Si la carrera seleccionada es una Ingenieria, se concatenan los resultados obtenidos antes con los de Ingenieria
      results = results.concat(ingenierias);
    }

    if(carrera.includes("T.U.")){//Si la carrera seleccionada es tecnica, se concatenan los resultados obtenidos antes con los de Carreras Tecnicas
      results = results.concat(tecnicas);
    }
  
    var resultsList = document.querySelector("#results");
    results.forEach(element => {
      var li = document.createElement("li");//Por cada destino filtrado se crea su elemento correspondiente en la lista de resultados
      li.innerText = element[1];
      li.classList.toggle("list-group-item");
      
      li.addEventListener("click", () => {//Por cada destino en la fila al ser clickeado, se construye el cuadro de visualizacion con todos los datos de interes.
        $('#myModal').modal('toggle');
        buildModal(element, cupos_caption);
      });

      resultsList.appendChild(li);
    });
  });
  /*------------------------------*/  

}

req.send();