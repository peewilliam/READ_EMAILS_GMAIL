const Imap = require('node-imap');
const {simpleParser} = require('mailparser');



var de = new Date('2022-11-09');
var ate = new Date('2022-11-18');
console.log(de, ate)

process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

const imapConfig = {
  user: 'mateus.silva@conlinebr.com.br',
  password: '192168@Sunni',
  host: 'imap.gmail.com',
  port: 993,
  tls: true,
};

var contagemEmail = 0;
const getEmails = () => {
  try {
    const imap = new Imap(imapConfig);
    imap.once('ready', () => {

    //   imap.getBoxes(function (err, boxes) {
    //     if(err) throw err;
    //    console.log(boxes)
    // });
    var totalEmailEnviado = 0;
    

    imap.openBox('[Gmail]/E-mails enviados', false, () => {
      imap.search(['ALL', ['SINCE', de], ['BEFORE', ate]], (err, resultsEnviados) => {
        console.log(resultsEnviados)
        totalEmailEnviado = resultsEnviados.length;
        console.log('Total de emails enviados até hoje: '+resultsEnviados.length)

          imap.openBox('[Gmail]/Todos os e-mails', false, () => {
            imap.search(['ALL'], (err, resultsTodosEmail) => {

   
              console.log('Total de emails recebidos até hoje: '+(resultsTodosEmail.length - totalEmailEnviado))
              
      
            })
          })
      })
    })

    

     
      // imap.openBox('[Gmail]/E-mails enviados', false, () => {
      //   imap.search(['ALL'], (err, results) => {
      //     // console.log(results.length)
      //     console.log('Este usuario enviou '+results.length+' email Hoje.')
      //   // imap.search(['ALL', ['SINCE', new Date()]], (err, results) => {
      //     const f = imap.fetch(results, {bodies: ''});

      //     f.on('message', msg => {

      //       msg.on('body', stream => {
              
      //         simpleParser(stream, async (err, parsed) => {
      //           const {from, subject, textAsHtml, text} = parsed;
      //           // contagemEmail++
      //           // console.log('Assunto:'+subject);
      //           /* Make API call to save the data
      //              Save the retrieved data into a database.
      //              E.t.c
      //           */
      //         });
             
      //       });
      //       msg.once('attributes', attrs => {
      //         const {uid} = attrs;
      //         imap.addFlags(uid, ['\\Seen'], () => {
      //           // Mark the email as read after reading it
      //           // console.log('Marked as read!');
      //         });
      //       });
      //     });
      //     f.once('error', ex => {
      //       return Promise.reject(ex);
      //     });
      //     f.once('end', () => {
      //       console.log('Done fetching all messages!');
            
      //       imap.end();
      //     });
      //   });
      // });
    });

    imap.once('error', err => {
      console.log(err);
    });

    imap.once('end', () => {
      // console.log('Connection ended');
     
    });

    imap.connect();
  } catch (ex) {
    console.log('an error occurred');
  }
};

getEmails();
