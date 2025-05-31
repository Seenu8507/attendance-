
exports.handler = function(context, event, callback) {
  const studentName = event.studentName || 'Unknown';
  const phoneNumber = event.phoneNumber || 'Unknown';

  const twiml = new Twilio.twiml.VoiceResponse();

  twiml.play('https://pearl-crocodile-8636.twil.io/assets/maruthuva-viduppu.mp3.mp3');
  twiml.say(`This call is about ${studentName}'s absence. Please respond.`);

  const gather = twiml.gather({
    input: 'dtmf',
    numDigits: 1,
    timeout: 5,
    method: 'POST',
    action: `  https://712a-2401-4900-67b2-f194-d9a8-169d-e45a-aea2.ngrok-free.app/api/twilio-webhook?studentName=${encodeURIComponent(studentName)}&phoneNumber=${encodeURIComponent(phoneNumber)}`
  });

  gather.say('Press 1 for sick leave, 2 for function leave, 3 for personal reason, 4 for other reason.');

  twiml.say('No input received. Goodbye!');

  return callback(null, twiml);
};


// Note: Make sure to replace the ngrok URL with your own when deploying.
