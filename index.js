const Imap = require('node-imap');
const {simpleParser} = require('mailparser');
const mysql = require('promise-mysql');

// process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;
const connection = mysql.createPool({
  connectionLimit : 10,
  host: '144.22.225.253',
  user: 'aplicacao',
  port: "3306",
  password: 'conline@2510A',
  database: 'SIRIUS',
  charset: "utf8mb4"
});

function getConnection() {
  return connection;
}



// async function SearchEmails(email, senha) {

//   return new Promise(function(resolve, reject) {
//     var contagemEmail = 0;
//   const imapConfig = {
//     user: email,
//     password: senha,
//     host: 'imap.gmail.com',
//     port: 993,
//     tls: true,
//   };


//   try {
//     const imap = new Imap(imapConfig);
//     imap.once('ready', () => {

//     //   imap.getBoxes(function (err, boxes) {
//     //     if(err) throw err;

//     // });
//     var totalEmailEnviado = 0;
    

//     imap.openBox('[Gmail]/E-mails enviados', false, () => {
//       imap.search(['ALL', ['SINCE', de], ['BEFORE', ate]], (err, resultsEnviados) => {
//         console.log(resultsEnviados)
//         totalEmailEnviado = resultsEnviados.length;
//         console.log(email+' Total de emails enviados até hoje: '+resultsEnviados.length)

//           imap.openBox('[Gmail]/Todos os e-mails', false, () => {
//             imap.search(['ALL'], (err, resultsTodosEmail) => {
//               resolve();
//               console.log(email+'Total de emails recebidos até hoje: '+(resultsTodosEmail.length - totalEmailEnviado))
    
//             })
//           })
//       })
//     })

     
//     });

//     imap.once('error', err => {
//       // console.log(err);
//       // reject(err)
//       console.log(email)
//       console.log('error 1')
//       resolve();
//     });

//     imap.once('end', () => {
//       // console.log('Connection ended');
//       // console.log(email)
//       // console.log('error 2')
//       // resolve();
      
//     });

//     imap.connect();
//   } catch (ex) {
//     console.log(email)
//     console.log('error 3')
//     console.log('an error occurred');
//     resolve();
//   }


//   });
// }


// async function conexaoColaboradores(){
// let conn = await getConnection();
// var colaboradores = await conn.query(`SELECT * FROM colaboradores WHERE sistema_status = 1`);
// // console.log(colaboradores.length)
//   await colaboradores.forEach( async element => {

//     // var email = element.email_corporativo.toLowerCase();
//     var email = element.email_corporativo != null ? element.email_corporativo.toLowerCase() : null;

//     var senha = element.senha_email != null ? element.senha_email.toLowerCase() : null;

//     if(senha != null && email != null){
//       console.log(senha, senha)
//       await SearchEmails('petryck.leite@conlinebr.com.br', '99659819aA@')
//       console.log('----')
//     }
    
    

      
//     });
// }

// conexaoColaboradores()
//  setInterval(async () => {
//   conexaoColaboradores();
//   // await SearchEmails('mateus.silva@conlinebr.com.br', '192168@Sunni2')
// }, 5000);

// conexaoColaboradores();

// SearchEmails('petryck.leite@conlinebr.com.br', '99659819aA@')




// SearchEmails();



async function SearchEmails(email, senha, inicio, fim,persistence) {
  // var inicio = inicio;
  // var final = final;

    var imapConfig = {
    user: email,
    password: senha,
    host: 'imap.gmail.com',
    port: 993,
    tls: true,
  };



var date_new_amanha = new Date(fim)
var fim = fim.setDate(date_new_amanha.getDate()+1);
var fim = new Date(fim)


// console.log(inicio.getDate(), fim.getDate())
// console.log(inicio, fim)

  return new Promise(async function(resolve, reject) {
    var conn = await getConnection();
     const imap = new Imap(imapConfig);
    imap.once('ready', () => {

        //  imap.getBoxes(function (err, boxes) {
        //       if(err) throw err;
        //     console.log(boxes)
        //   });

    var totalEmailEnviado = 0;
    var emailsenviadosError = 0;
    imap.openBox('[Gmail]/E-mails enviados', true, () => {
      imap.search(['ALL', ['SINCE', inicio],['BEFORE', fim]], (err, resultsEnviados) => {

        totalEmailEnviado = resultsEnviados.length;

          imap.openBox('[Gmail]/Todos os e-mails', true, () => {
  
            imap.search(['ALL', ['SINCE', inicio], ['BEFORE', fim],['FROM', email], ['to', email]], async (err, resultemailsenviadosError) => {
         
              emailsenviadosError = resultemailsenviadosError.length
             
              
            })

            imap.search(['ALL', ['SINCE', inicio],['BEFORE', fim], ['to', email]], async (err, resultsTodosEmail) => {
             
              var emailsrecebidos = resultsTodosEmail.length-emailsenviadosError
              await conn.query(`INSERT INTO SIRIUS.LogEmailsMetricas (email, senha, descricao, data, type) VALUES ('${email}', '${senha}', '', '${formatDateagora(inicio)}', 0)`);
              
              await conn.query(`INSERT INTO SIRIUS.MetricasEmails 
              (email, enviados, recebidos, data_consulta, inicioPeriodo) 
              VALUES 
              ('${email}', '${totalEmailEnviado}', '${emailsrecebidos}', '${formatDateagora(inicio)}', '${new Date(inicio).getTime()}')`);
              
              // console.log(email)
              // console.log('Enviados:'+totalEmailEnviado)
              // console.log('Recebidos:'+emailsrecebidos)


              if(persistence == true){
                await conn.query(`DELETE FROM SIRIUS.PersistenteEmailsMetricas WHERE email = '${email}' AND (date(data) >= '${formatStringTiDateUS(inicio)}' AND date(data) <= '${formatStringTiDateUS(inicio)}');`);
    
              }
              resolve();
              
    
            })
          })
      })
    })

   
    


     
    });

     imap.once('error', async err => {

     await conn.query(`INSERT INTO SIRIUS.LogEmailsMetricas (email, senha, descricao, data, type) VALUES ('${email}', '${senha}', '${err}', '${formatDateagora()}', 1)`);

     if(persistence == false){
      // console.log('entrou é false')
      await conn.query(`INSERT INTO SIRIUS.PersistenteEmailsMetricas (email, data) VALUES ('${email}', '${formatDateagora()}')`);

    }
     
      resolve();
    });

    imap.once('end', () => {

      // console.log('Connection ended');
      resolve();
      
    });


    if(imap.state != 'authenticated') { //So, I check here if the state is 'authenticated' to make sure, otherwise the execution fails at some point.
      imap.connect() //So, I try to make the connection again.
    }
    // imap.connect();

    
  })
}


async function start(persistence){
  let conn = await getConnection();
  var colaboradores = await conn.query(`SELECT * FROM colaboradores WHERE sistema_status = 1 ORDER BY nome asc`);

  for (const element of colaboradores) {

    var email = element.email_corporativo != null ? element.email_corporativo.toLowerCase() : null;
    var senha = element.senha_email != null ? element.senha_email : null;

    if(senha != null && email != null){
    
      await SearchEmails(email, senha, new Date(formatDateUS()+' 00:00:00'),new Date(formatDateUS()+' 00:00:00'), persistence)
      //await SearchEmails(email, senha, new Date(formatDateBR()+' 00:00:00'), new Date(formatDateBR()+' 23:59:59'))

    }
  }
    

}


async function VerificaErros(){

  let conn = await getConnection();
  var colaboradores = await conn.query(`SELECT * FROM SIRIUS.PersistenteEmailsMetricas
  JOIN SIRIUS.colaboradores ON SIRIUS.PersistenteEmailsMetricas.email = SIRIUS.colaboradores.email_corporativo`);

  var persistence = true;

  if(colaboradores.length > 0){

    for (const element of colaboradores) {

      var email = element.email_corporativo != null ? element.email_corporativo.toLowerCase() : null;
      var senha = element.senha_email != null ? element.senha_email : null;

        if(senha != null && email != null){

          // console.log(formatDateUS(element.data)+' 00:00:00')
          // console.log(new Date(formatDateUS(element.data)+' 00:00:00').toUTCString(), new Date(formatDateUS(element.data)+' 23:59:59').toUTCString())

       
           await SearchEmails(email, senha, new Date(formatDateUS(element.data)+' 00:00:00'), new Date(formatDateUS(element.data)+' 00:00:00'), persistence)
        }
        
    }
  }

}

setInterval(async () => {
  console.log('foi')
 await VerificaErros()
}, 60000);



// SearchEmails('petryck.leite@conlinebr.com.br', '99659819aA@', new Date(formatDateUS('2022-12-13 00:00:00')+' 00:00:00'), new Date(formatDateUS('2022-12-13 00:00:00')+' 00:00:00'), true)

setInterval(async () => {
  var d = new Date();
  h = d.getHours();
  m = d.getMinutes();

  var conn = await getConnection();

  if(h == 23){
    await conn.query(`INSERT INTO SIRIUS.LogEmailsMetricas (email, senha, descricao, data, type) VALUES ('', '', 'iniciou consulta', '${formatDateagora()}', 0)`);
    var persistence = false
    start(persistence)
  }else{
    await conn.query(`INSERT INTO SIRIUS.LogEmailsMetricas (email, senha, descricao, data, type) VALUES ('', '', 'verificacao de hora ', '${formatDateagora()}', 1)`);
  }

}, 60000*60);
// SearchEmails('artur.passos@conlinebr.com.br', 'Busxba8c', new Date(formatDateUS()+' 00:00:00'))
// start(false)

function formatDateUS(string) {

  if(string){
    var d = new Date(string);
  }else{
    var d = new Date();
  }
    month = "" + (d.getMonth() + 1);
    day = "" + d.getDate();
    year = d.getFullYear();
  h = d.getHours();
  m = d.getMinutes();
  s = d.getSeconds();

  if (month.length < 2) month = "0" + month;
  if (day.length < 2) day = "0" + day;

  if (h.length < 2 || m < 10) {
    h = "0" + h;
  }

  if (m.length < 2 || m < 10) {
    m = "0" + m;
  }
  if (s.length < 2 || s < 10) {
    s = "0" + s;
  }

  
  // return [month, day, year].join("-");
  return [year, month, day].join("-");
}

function formatStringTiDateUS(string) {
  var d = new Date(string),
    month = "" + (d.getMonth() + 1),
    day = "" + d.getDate(),
    year = d.getFullYear();
  h = d.getHours();
  m = d.getMinutes();
  s = d.getSeconds();

  if (month.length < 2) month = "0" + month;
  if (day.length < 2) day = "0" + day;

  if (h.length < 2 || m < 10) {
    h = "0" + h;
  }

  if (m.length < 2 || m < 10) {
    m = "0" + m;
  }
  if (s.length < 2 || s < 10) {
    s = "0" + s;
  }
  return [year, month, day].join("-");
}

function formatDateagora(string) {

  if(string){
    var d = new Date(string);
  }else{
    var d = new Date();
  }


    month = "" + (d.getMonth() + 1);
    day = "" + d.getDate();
    year = d.getFullYear();
  h = d.getHours();
  m = d.getMinutes();
  s = d.getSeconds();

  if (month.length < 2) month = "0" + month;
  if (day.length < 2) day = "0" + day;


  if (h.length < 2 || m < 10) {
    h = "0" + h;
  }


  if (m.length < 2 || m < 10) {
    m = "0" + m;
  }
  if (s.length < 2 || s < 10) {
    s = "0" + s;
  }
  return [year, month, day].join("-")+' '+h+':'+m+':'+s;
}
// var de = new Date('2022-11-09');
// var ate = new Date('2022-11-18');