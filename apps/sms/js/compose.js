/* -*- Mode: js; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- /
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */

'use strict';

/**
 * Handle UI specifics of message composition. Namely,
 * resetting (auto manages placeholder text), getting
 * message content, and message size
 */
var Compose = (function() {
  var placeholderClass = 'placeholder';

  var attachments = new WeakMap();

  // will be defined in init
  var dom = {
    form: null,
    message: null,
    button: null
  };

  function composeCheck(e) {
    var empty = !dom.message.textContent.length;
    if (empty) {
      var brs = dom.message.querySelectorAll('br');
      var attachment = dom.message.querySelector('iframe');
      // firefox will keep an extra <br> in there
      if (brs.length > 1 || attachment !== null) {
        empty = false;
      }
    }
    var placeholding = dom.message.classList.contains(placeholderClass);
    if (placeholding && !empty) {
      dom.message.classList.remove(placeholderClass);
      compose.disable(false);
    }
    if (!placeholding && empty) {
      dom.message.classList.add(placeholderClass);
      compose.disable(true);
    }

    // TODO: remove this; failsafe for current code
    // Bug: https://bugzilla.mozilla.org/show_bug.cgi?id=869159
    dom.message.value = dom.message.textContent;
  }

  function insert(item) {
    var fragment = document.createDocumentFragment();

    if (item.render) { // it's an Attachment
      var node = item.render();
      attachments.set(node, item);
      fragment.appendChild(node);
    } else if (item.tagName === 'IFRAME') {
      // this iframe is generated by us
      fragment.appendChild(item);
    } else if (typeof item === 'string') {
      var container = document.createElement('div');
      container.innerHTML = item;
      [].forEach.call(container.childNodes, function(node) {
        if (node.tagName === 'BR') {
          fragment.appendChild(document.createElement('br'));
        }
        else if (node.nodeType === Node.TEXT_NODE) {
          fragment.appendChild(node);
        }
      });
    }

    return fragment;
  }

  var compose = {
    init: function thui_compose_init(formId) {
      dom.form = document.getElementById(formId);
      dom.message = dom.form.querySelector('[contenteditable]');
      dom.button = dom.form.querySelector('button');

      // update the placeholder after input
      dom.message.addEventListener('input', composeCheck);
      composeCheck();
      return this;
    },

    getContent: function() {
      var content = [];
      var lastContent = 0;
      var node;
      var i;

      for (node = dom.message.firstChild; node; node = node.nextSibling) {
        // hunt for an attachment in the WeakMap and append it
        var attachment = attachments.get(node);
        if (attachment) {
          lastContent = content.push(attachment);
          continue;
        }

        var last = content.length - 1;
        var text = node.textContent;
        // append (if possible) text to the last entry
        if (text.length && typeof content[last] === 'string') {
          content[last] += text;
        } else {
          // push even if text.length === 0, there could be a <br>
          content.push(text);
        }

        // keep track of the last populated line
        if (text.length > 0) {
          lastContent = content.length;
        }
      }
      // trim away any trailing empty lines
      return content.slice(0, lastContent);
    },

    disable: function(state) {
      dom.button.disabled = state;
      return this;
    },

    /** Writes node to composition element
     * @param {mixed} item Html, DOMNode, or attachment to add
     *                     to composition element.
     * @param {Boolean} position True to append, false to prepend or
     *                           undefined/null for auto (at cursor).
     */

    prepend: function(item) {
      var fragment = insert(item);

      // If the first element is a <br>, it needs to stay first
      // insert after it but before everyting else
      if (dom.message.firstChild && dom.message.firstChild.nodeName === 'BR') {
        dom.message.insertBefore(fragment, dom.message.childNodes[1]);
      } else {
        dom.message.insertBefore(fragment, dom.message.childNodes[0]);
      }

      composeCheck();
      ThreadUI.updateInputHeight();
      return this;
    },

    append: function(item) {
      var fragment = insert(item);

      if (document.activeElement === dom.message) {
        var range = window.getSelection().getRangeAt(0);
        var firstNodes = fragment.firstChild;
        range.deleteContents();
        range.insertNode(fragment);
        dom.message.focus();
        range.setStartAfter(firstNodes);
      } else {
        dom.message.appendChild(fragment);
      }

      composeCheck();
      ThreadUI.updateInputHeight();
      return this;
    },

    clear: function() {
      dom.message.innerHTML = '';
      composeCheck();
      return this;
    }

  };
  return compose;
}());
