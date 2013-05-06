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
  'MozActivity',
  'alert'
]);

mocksHelperForThreadUI.init();

suite('thread_ui.js >', function() {
  var container;
  var sendButton;
  var input;
  var composeForm;
  var recipient;

  var realMozL10n;
  var realMozMobileMessage;

  var mocksHelper = mocksHelperForThreadUI;
  var testImageBlob;
  var testAudioBlob;

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
        if (--assetsNeeded) {
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
  });

  suiteTeardown(function() {
    navigator.mozL10n = realMozL10n;
    mocksHelper.suiteTeardown();
  });

  setup(function() {
    mocksHelper.setup();

    loadBodyHTML('/index.html');
    
    container =  document.querySelector("#thread-messages");
    sendButton = container.querySelector('#messages-send-button');
    input = container.querySelector('#messages-input');

    ThreadUI.init();
    realMozMobileMessage = ThreadUI._mozMobileMessage;
    ThreadUI._mozMobileMessage = MockNavigatormozMobileMessage;
  });

  teardown(function() {
    container.parentNode.removeChild(container);
    container = null;

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
    });
  });

  suite('updateCounter() >', function() {
    suite('in first segment >', function() {
      setup(function() {
        MockNavigatormozMobileMessage.mNextSegmentInfo = {
          segments: 1,
          charsAvailableInLastSegment: 20
        };

        ThreadUI.updateCounter();
      });

      test('no counter is displayed', function() {
        assert.equal(sendButton.dataset.counter, '');
      });

      test('no alert is sent', function() {
        assert.isNull(Mockalert.mLastMessage);
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

        ThreadUI.updateCounter();
      });

      test('a counter is displayed', function() {
        var expected = availableChars + '/' + segment;
        assert.equal(sendButton.dataset.counter, expected);
      });

      test('no alert is sent', function() {
        assert.isNull(Mockalert.mLastMessage);
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

        ThreadUI.updateCounter();
      });

      test('a counter is displayed', function() {
        var expected = availableChars + '/' + segment;
        assert.equal(sendButton.dataset.counter, expected);
      });

      test('no alert is sent', function() {
        assert.isNull(Mockalert.mLastMessage);
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

        ThreadUI.updateCounter();
      });

      test('a counter is displayed', function() {
        var expected = availableChars + '/' + segment;
        assert.equal(sendButton.dataset.counter, expected);
      });

      test('no alert is sent', function() {
        assert.isNull(Mockalert.mLastMessage);
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

        ThreadUI.updateCounter();
      });

      test('a counter is displayed', function() {
        var expected = availableChars + '/' + segment;
        assert.equal(sendButton.dataset.counter, expected);
      });

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

      audio = output.querySelector('img');
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
});
