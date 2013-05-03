/*
  Compose Tests
*/
'use strict';

mocha.globals(['0']);

requireApp('sms/js/compose.js');
requireApp('sms/test/unit/mock_attachment.js');
require('/shared/test/unit/load_body_html_helper.js');

suite('compose_test.js', function() {

  suite('Message Composition', function() {

    var message;
    setup(function() {

      loadBodyHTML('/index.html');
      ThreadUI.init();
      message = Compose.dom.message;

    });
    suite('Placeholder', function() {
      setup(function(done) {
        Compose.clear();
        done();
      });
      test('Placeholder present by default', function() {
        assert.isTrue(message.classList.contains('placeholder'), 'added');
      });
      test('Placeholder removed on input resulting in content', function() {
        Compose.append('text');
        assert.isFalse(message.classList.contains('placeholder'), 'removed');
      });
      test('Placeholder present on input resulting in empty', function() {
        Compose.clear();
        assert.isTrue(message.classList.contains('placeholder'), 'readded');
      });
      test('Placeholder removed on input of attachment', function() {
        var attachment = new MockAttachment('image',
                       '/test/unit/media/IMG_0554.jpg', '12345');
        Compose.append(attachment);
        var txt = Compose.getContent();
        var contains = message.classList.contains('placeholder');
        // clearing to remove the iframe so that mocha doesn't
        // get alarmed at window[0] pointing to the iframe
        Compose.clear();
        assert.isFalse(contains, 'removed');
      });
      teardown(function() {
        Compose.clear();
      });
    });

    suite('Clearing Message', function() {
      setup(function() {
        Compose.clear();
      });

      test('Clear removes text', function() {
        Compose.append('start');
        var txt = Compose.getContent();
        assert.equal(txt.length, 1, 'One line in the txt');
        Compose.clear();
        txt = Compose.getContent();
        assert.equal(txt.length, 0, 'No lines in the txt');
      });
      test('Clear removes attachment', function() {
        var attachment = new MockAttachment('image',
                       '/test/unit/media/IMG_0554.jpg', '12345');
        Compose.append(attachment);
        var txt = Compose.getContent();
        // clearing to remove the iframe so that mocha doesn't
        // get alarmed at window[0] pointing to the iframe
        Compose.clear();
        assert.equal(txt.length, 1, 'One line in txt');
        Compose.clear();
        txt = Compose.getContent();
        assert.equal(txt.length, 0, 'No lines in the txt');
      });
    });

    suite('Message insert, append, prepend', function() {
      test('Message appended', function() {
        Compose.append('start');
        var txt = Compose.getContent();
        assert.equal(txt[0], 'start', 'text is appended');
      });
      test('Message prepend', function() {
        Compose.append('end');
        Compose.prepend('start');
        var txt = Compose.getContent();
        assert.equal(txt[0], 'startend', 'text is inserted at beginning');
      });
      test('Message insert - DOM node', function() {
        var node = document.createElement('div');
        node.innerHTML = 'NODE';
        Compose.append(node);
        var txt = Compose.getContent();
        assert.equal(txt[0], 'NODE', 'First line contains "NODE"');
      });
      teardown(function() {
        Compose.clear();
      });
    });

    suite('Getting Message via getContent()', function() {
      setup(function() {
        Compose.clear();
      });
      test('Just text - simple', function() {
        Compose.append('start');
        Compose.append('end');
        var txt = Compose.getContent();
        assert.equal(txt.length, 1, 'One line in the txt');
        assert.equal(txt[0], 'startend', 'resulting txt ok');
      });
      test('Just text - line breaks', function() {
        Compose.append('start');
        Compose.append('<br>');
        Compose.append('end');
        var txt = Compose.getContent();
        assert.equal(txt.length, 2, 'Two lines in txt');
        assert.equal(txt[0], 'start', 'first line is isolated');
        assert.equal(txt[1], 'end', 'last line is isolated');
      });
      test('Trailing line breaks stripped', function() {
        Compose.append('start');
        Compose.append('<br>');
        Compose.append('end');
        Compose.append(new Array(20).join('<br>'));
        var txt = Compose.getContent();
        assert.equal(txt.length, 2, 'Two lines in txt');
        assert.equal(txt[0], 'start', 'first line is isolated');
        assert.equal(txt[1], 'end', 'last line is isolated');
      });
      test('Just attachment', function() {
        var attachment = new MockAttachment('image',
                       '/test/unit/media/IMG_0554.jpg', '12345');
        Compose.append(attachment);
        var txt = Compose.getContent();
        // clearing to remove the iframe so that mocha doesn't
        // get alarmed at window[0] pointing to the iframe
        Compose.clear();
        assert.equal(txt.length, 1, 'One line in txt');
        assert.ok(txt[0] instanceof MockAttachment, 'Sub 0 is an attachment');
      });
      test('Attachment in middle of text', function() {
        var attachment = new MockAttachment('image',
                       '/test/unit/media/IMG_0554.jpg', '54321');
        Compose.append('start');
        Compose.append(attachment);
        Compose.append('end');
        var txt = Compose.getContent();
        // clearing to remove the iframe so that mocha doesn't
        // get alarmed at window[0] pointing to the iframe
        Compose.clear();
        assert.equal(txt.length, 3, 'Three lines in txt');
        assert.equal(txt[0], 'start', 'First line is start text');
        assert.ok(txt[1] instanceof MockAttachment, 'Sub 1 is an attachment');
        assert.equal(txt[2], 'end', 'Last line is end text');
      });
      test('attachment with excess breaks', function() {
        var attachment = new MockAttachment('image',
                       '/test/unit/media/IMG_0554.jpg', '55555');
        Compose.append('start');
        // keep in mind FF will render <br><br> as just one :/
        Compose.append('<br><br><br><br>');
        Compose.append(attachment);
        Compose.append('end');
        var txt = Compose.getContent();
        assert.equal(txt.length, 5, 'Three lines in txt');
        assert.equal(txt[0], 'start', 'First line is start text');
        assert.ok(txt[3] instanceof MockAttachment, 'Sub 4 is an attachment');
        assert.equal(txt[4], 'end', 'Last line is end text');
      });
      teardown(function() {
        Compose.clear();
      });
    });

    suite('Message Attachment Iframe', function() {
      setup(function() {
        Compose.clear();
      });

      test('Attaching creates iframe.attachment', function() {
        var attachment = new MockAttachment('image',
                       '/test/unit/media/IMG_0554.jpg', '12345');
        Compose.append(attachment);
        var iframes = message.querySelectorAll('iframe');
        var txt = Compose.getContent();
        // clearing to remove the iframe so that mocha doesn't
        // get alarmed at window[0] pointing to the iframe
        Compose.clear();
        assert.equal(iframes.length, 1, 'One iframe');
        assert.ok(iframes[0].classList.contains('attachment'), '.attachment');
        assert.ok(txt[0] === attachment, 'iframe WeakMap\'d to attachment');
      });
    });
  });
});