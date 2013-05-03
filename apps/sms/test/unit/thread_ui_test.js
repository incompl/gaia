'use strict';

// remove this when https://github.com/visionmedia/mocha/issues/819 is merged in
// mocha and when we have that new mocha in test agent
mocha.setup({ globals: ['alert'] });

requireApp('sms/test/unit/mock_alert.js');
requireApp('sms/test/unit/mock_l10n.js');
requireApp('sms/js/utils.js');
requireApp('sms/test/unit/mock_utils.js');
requireApp('sms/test/unit/mock_navigatormoz_sms.js');
requireApp('sms/test/unit/mock_link_helper.js');
requireApp('sms/test/unit/mock_moz_activity.js');
requireApp('sms/js/thread_ui.js');

var mocksHelperForThreadUI = new MocksHelper([
  'Utils',
  'LinkHelper',
  'MozActivity'
]);

mocksHelperForThreadUI.init();

suite('thread_ui.js >', function() {
  var sendButton;
  var input;
  var composeForm;
  var recipient;

  var realMozL10n;
  var realMozMobileMessage;

  var mocksHelper = mocksHelperForThreadUI;
  var testImageBlob;
  var testAudioBlob;
  var testVideoBlob;

  suiteSetup(function(done) {
    mocksHelper.suiteSetup();

    realMozL10n = navigator.mozL10n;
    navigator.mozL10n = MockL10n;

    var assetsNeeded = 0;
    function getAsset(filename, loadCallback) {
      assetsNeeded++;

      var req = new XMLHttpRequest();
      req.open('GET', filename, true);
      req.responseType = 'blob';
      req.onload = function() {
        loadCallback(req.response);
        if (--assetsNeeded === 0) {
          done();
        }
      };
      req.send();
    }
    getAsset('/test/unit/media/kitten-450.jpg', function(blob) {
      testImageBlob = blob;
    });
    getAsset('/test/unit/media/audio.oga', function(blob) {
      testAudioBlob = blob;
    });
    getAsset('/test/unit/media/video.ogv', function(blob) {
      testVideoBlob = blob;
    });
  });

  suiteTeardown(function() {
    navigator.mozL10n = realMozL10n;
    mocksHelper.suiteTeardown();
  });

  setup(function() {
    mocksHelper.setup();
    loadBodyHTML('/index.html');

<<<<<<< HEAD
    sendButton = document.getElementById('messages-send-button');
    input = document.getElementById('messages-input');
    composeForm = document.getElementById('messages-compose-form');
    recipient = document.getElementById('messages-recipient');
=======
    loadBodyHTML('/index.html');
    
    container =  document.querySelector("#thread-messages");
    sendButton = container.querySelector('#messages-send-button');
    input = container.querySelector('#messages-input');
>>>>>>> 840069

    ThreadUI.init();
    realMozMobileMessage = ThreadUI._mozMobileMessage;
    ThreadUI._mozMobileMessage = MockNavigatormozMobileMessage;
  });

  teardown(function() {
    document.body.innerHTML = '';

    MockNavigatormozMobileMessage.mTeardown();
    mocksHelper.teardown();
    ThreadUI._mozMobileMessage = realMozMobileMessage;
  });

  suite('enableSend() >', function() {
    setup(function() {
      ThreadUI.updateCounter();
    });

    test('button should be disabled at the beginning', function() {
      ThreadUI.enableSend();
      assert.isTrue(sendButton.disabled);
    });

    test('button should be enabled when there is some text', function() {
      Compose.append('hola');
      ThreadUI.enableSend();
      assert.isFalse(sendButton.disabled);
    });

    test('button should be disabled if there is some text ' +
      'but too many segments', function() {

      MockNavigatormozMobileMessage.mNextSegmentInfo = {
        segments: 11,
        charsAvailableInLastSegment: 10
      };
      input.value = 'Hola';

      ThreadUI.enableSend();

      assert.isTrue(sendButton.disabled);
    });

    suite('#new mode >', function() {
      setup(function() {
        window.location.hash = '#new';
      });

      teardown(function() {
        window.location.hash = '';
      });

      test('button should be disabled when there is neither contact or input',
        function() {

        ThreadUI.enableSend();
        assert.isTrue(sendButton.disabled);
      });

      test('button should be disabled when there is no contact', function() {
        Compose.append('hola');
        ThreadUI.enableSend();
        assert.isTrue(sendButton.disabled);
      });

      test('button should be enabled when there is both contact and input',
        function() {

        Compose.append('hola');
        var recipient = ThreadUI.appendEditableRecipient();
        ThreadUI.createRecipient(recipient);
        ThreadUI.enableSend();
        assert.isFalse(sendButton.disabled);
      });

      test('button should be enabled when there is both contact and input, ' +
          'but too many segments',
        function() {

        MockNavigatormozMobileMessage.mNextSegmentInfo = {
          segments: 11,
          charsAvailableInLastSegment: 10
        };
        ThreadUI.input.value = 'Hola';
        var recipient = ThreadUI.appendEditableRecipient();
        ThreadUI.createRecipient(recipient);

        ThreadUI.enableSend();

        assert.isTrue(sendButton.disabled);
      });
    });
  });

  suite('updateCounter() >', function() {
    var banner, shouldEnableSend;

    setup(function() {
      banner = document.getElementById('messages-max-length-notice');
    });

    suite('no characters entered >', function() {
      setup(function() {
        MockNavigatormozMobileMessage.mNextSegmentInfo = {
          segments: 0,
          charsAvailableInLastSegment: 0
        };

        // display the banner to check that it is correctly hidden
        banner.classList.remove('hide');

        // add a maxlength to check that it is correctly removed
        input.setAttribute('maxlength', 25);

        shouldEnableSend = ThreadUI.updateCounter();
      });

      test('no counter is displayed', function() {
        assert.equal(sendButton.dataset.counter, '');
      });

      test('the user can enter more characters', function() {
        assert.equal(input.maxLength, -1);
      });

      test('no banner is displayed', function() {
        assert.ok(banner.classList.contains('hide'));
      });
    });

    suite('in first segment >', function() {
      setup(function() {
        MockNavigatormozMobileMessage.mNextSegmentInfo = {
          segments: 1,
          charsAvailableInLastSegment: 20
        };

        // display the banner to check that it is correctly hidden
        banner.classList.remove('hide');

        // add a maxlength to check that it is correctly removed
        input.setAttribute('maxlength', 25);

        shouldEnableSend = ThreadUI.updateCounter();
      });

      test('no counter is displayed', function() {
        assert.equal(sendButton.dataset.counter, '');
      });

<<<<<<< HEAD
      test('the user can enter more characters', function() {
        assert.equal(input.maxLength, -1);
      });

      test('no banner is displayed', function() {
        assert.ok(banner.classList.contains('hide'));
      });

      test('the send button should be enabled', function() {
        assert.isTrue(shouldEnableSend);
=======
      test('no alert is sent', function() {
        assert.isNull(Mockalert.mLastMessage);
>>>>>>> 840069
      });
    });

    suite('in first segment, less than 10 chars left >', function() {
      var segment = 1,
          availableChars = 10;

      setup(function() {
        MockNavigatormozMobileMessage.mNextSegmentInfo = {
          segments: segment,
          charsAvailableInLastSegment: availableChars
        };

        // display the banner to check that it is correctly hidden
        banner.classList.remove('hide');

        // add a maxlength to check that it is correctly removed
        input.setAttribute('maxlength', 25);

        shouldEnableSend = ThreadUI.updateCounter();
      });

      test('a counter is displayed', function() {
        var expected = availableChars + '/' + segment;
        assert.equal(sendButton.dataset.counter, expected);
      });

<<<<<<< HEAD
      test('the user can enter more characters', function() {
        assert.equal(input.maxLength, -1);
      });

      test('no banner is displayed', function() {
        assert.ok(banner.classList.contains('hide'));
      });

      test('the send button should be enabled', function() {
        assert.isTrue(shouldEnableSend);
=======
      test('no alert is sent', function() {
        assert.isNull(Mockalert.mLastMessage);
>>>>>>> 840069
      });
    });

    suite('in second segment >', function() {
      var segment = 2,
          availableChars = 20;

      setup(function() {
        MockNavigatormozMobileMessage.mNextSegmentInfo = {
          segments: segment,
          charsAvailableInLastSegment: availableChars
        };

        // display the banner to check that it is correctly hidden
        banner.classList.remove('hide');

        // add a maxlength to check that it is correctly removed
        input.setAttribute('maxlength', 25);

        shouldEnableSend = ThreadUI.updateCounter();
      });

      test('a counter is displayed', function() {
        var expected = availableChars + '/' + segment;
        assert.equal(sendButton.dataset.counter, expected);
      });

<<<<<<< HEAD
      test('the user can enter more characters', function() {
        assert.equal(input.maxLength, -1);
      });

      test('no banner is displayed', function() {
        assert.ok(banner.classList.contains('hide'));
      });

      test('the send button should be enabled', function() {
        assert.isTrue(shouldEnableSend);
=======
      test('no alert is sent', function() {
        assert.isNull(Mockalert.mLastMessage);
>>>>>>> 840069
      });
    });

    suite('in last segment >', function() {
      var segment = 10,
          availableChars = 20;

      setup(function() {
        MockNavigatormozMobileMessage.mNextSegmentInfo = {
          segments: segment,
          charsAvailableInLastSegment: availableChars
        };

        // display the banner to check that it is correctly hidden
        banner.classList.remove('hide');

        // add a maxlength to check that it is correctly removed
        input.setAttribute('maxlength', 25);

        shouldEnableSend = ThreadUI.updateCounter();
      });

      test('a counter is displayed', function() {
        var expected = availableChars + '/' + segment;
        assert.equal(sendButton.dataset.counter, expected);
      });

<<<<<<< HEAD
      test('the user can enter more characters', function() {
        assert.equal(input.maxLength, -1);
      });

      test('no banner is displayed', function() {
        assert.ok(banner.classList.contains('hide'));
      });

      test('the send button should be enabled', function() {
        assert.isTrue(shouldEnableSend);
=======
      test('no alert is sent', function() {
        assert.isNull(Mockalert.mLastMessage);
>>>>>>> 840069
      });
    });

    suite('in last segment, no characters left >', function() {
      var segment = 10,
          availableChars = 0;

      setup(function() {
        MockNavigatormozMobileMessage.mNextSegmentInfo = {
          segments: segment,
          charsAvailableInLastSegment: availableChars
        };

        // display the banner again, to check it's correctly displayed
        banner.classList.add('hide');
        shouldEnableSend = ThreadUI.updateCounter();
      });

      test('a counter is displayed', function() {
        var expected = availableChars + '/' + segment;
        assert.equal(sendButton.dataset.counter, expected);
      });

      test('the user can not enter more characters', function() {
        assert.equal(input.maxLength, input.value.length);
      });

      test('the banner is displayed', function() {
        assert.isFalse(banner.classList.contains('hide'));
      });

      test('the banner has the max length message', function() {
        var actual = banner.querySelector('p').textContent;
        assert.equal(actual, 'messages-max-length-text');
      });

      test('the send button should be enabled', function() {
        assert.isTrue(shouldEnableSend);
      });
    });

    suite('too many segments >', function() {
      var segment = 11,
          availableChars = 25;

      setup(function() {
        MockNavigatormozMobileMessage.mNextSegmentInfo = {
          segments: segment,
          charsAvailableInLastSegment: availableChars
        };

        shouldEnableSend = ThreadUI.updateCounter();
      });

      test('a counter is displayed', function() {
        var expected = availableChars + '/' + segment;
        assert.equal(sendButton.dataset.counter, expected);
      });

<<<<<<< HEAD
      test('the user can not enter more characters', function() {
        assert.equal(input.maxLength, input.value.length);
      });

      test('the banner is displayed', function() {
        assert.isFalse(banner.classList.contains('hide'));
      });

      test('the banner has the exceeded length message', function() {
        var actual = banner.querySelector('p').textContent;
        assert.equal(actual, 'messages-exceeded-length-text');
      });

      test('the send button should be disabled', function() {
        assert.isFalse(shouldEnableSend);
      });
=======
>>>>>>> 840069
    });
  });

  suite('createMmsContent', function() {
    test('generated html', function() {
      var inputArray = [{
        text: '&escapeTest',
        name: 'imageTest.jpg',
        blob: testImageBlob
      }];
      var output = ThreadUI.createMmsContent(inputArray);
      var img = output.querySelectorAll('img');
      assert.equal(img.length, 1);
      var span = output.querySelectorAll('span');
      assert.equal(span.length, 1);
      assert.equal(span[0].innerHTML.slice(0, 5), '&amp;');
    });
  });

  suite('MMS images', function() {
    var img;
    setup(function() {
      // create an image mms DOM Element:
      var inputArray = [{
        name: 'imageTest.jpg',
        blob: testImageBlob
      }];

      // quick dirty creation of a thread with image:
      var output = ThreadUI.createMmsContent(inputArray);
      // need to get a container from ThreadUI because event is delegated
      var messageContainer = ThreadUI.getMessageContainer(Date.now(), false);
      messageContainer.appendChild(output);

      img = output.querySelector('img');
    });
    test('MozActivity is called with the proper info on click', function() {
      // Start the test: simulate a click event
      img.click();

      assert.equal(MockMozActivity.calls.length, 1);
      var call = MockMozActivity.calls[0];
      assert.equal(call.name, 'open');
      assert.equal(call.data.type, 'image/jpeg');
      assert.equal(call.data.filename, 'imageTest.jpg');
      assert.equal(call.data.blob, testImageBlob);
    });
  });

  suite('MMS audio', function() {
    var audio;
    setup(function() {
      // create an image mms DOM Element:
      var inputArray = [{
        name: 'audio.oga',
        blob: testAudioBlob
      }];

      // quick dirty creation of a thread with image:
      var output = ThreadUI.createMmsContent(inputArray);
      // need to get a container from ThreadUI because event is delegated
      var messageContainer = ThreadUI.getMessageContainer(Date.now(), false);
      messageContainer.appendChild(output);

      audio = output.querySelector('.audio-placeholder');
    });

    test('MozActivity is called with the proper info on click', function() {
      audio.click();

      // check that the MozActivity was called with the proper info
      assert.equal(MockMozActivity.calls.length, 1);
      var call = MockMozActivity.calls[0];
      assert.equal(call.name, 'open');
      assert.equal(call.data.type, 'audio/ogg');
      assert.equal(call.data.filename, 'audio.oga');
      assert.equal(call.data.blob, testAudioBlob);
    });
  });

  suite('MMS video', function() {
    var video;
    setup(function() {
      // create an image mms DOM Element:
      var inputArray = [{
        name: 'video.ogv',
        blob: testVideoBlob
      }];

      // quick dirty creation of a thread with video:
      var output = ThreadUI.createMmsContent(inputArray);
      // need to get a container from ThreadUI because event is delegated
      var messageContainer = ThreadUI.getMessageContainer(Date.now(), false);
      messageContainer.appendChild(output);

      video = output.querySelector('.video-placeholder');
    });

    test('MozActivity is called with the proper info on click', function() {
      video.click();

      // check that the MozActivity was called with the proper info
      assert.equal(MockMozActivity.calls.length, 1);
      var call = MockMozActivity.calls[0];
      assert.equal(call.name, 'open');
      assert.equal(call.data.type, 'video/ogg');
      assert.equal(call.data.filename, 'video.ogv');
      assert.equal(call.data.blob, testVideoBlob);
    });
  });
});
