define([
  'bonsai/renderer/svg/svg'
], function(SvgRenderer) {
  describe('SvgRenderer', function() {
    function createFakeDomNode() {
      return {
        ownerSVGElement: {},
        appendChild: function() {},
        setAttribute: function() {}
      };
    }
    function createSvgRenderer() {
      return new SvgRenderer(createFakeDomNode(), 1, 1);
    }

    it('should accept a dom id for the node argument', function () {
      spyOn(document, 'getElementById').andReturn(createFakeDomNode());
      spyOn(SvgRenderer, 'Svg');

      new SvgRenderer('thing', 1, 1);

      expect( SvgRenderer.Svg ).toHaveBeenCalledWith( createFakeDomNode(), 1, 1);
    });


    describe('allowEventDefaults', function() {
      it('should assign the constructor value as property', function() {
        expect(new SvgRenderer(createFakeDomNode(), 1, 1, {
          allowEventDefaults: true
        }).allowEventDefaults).toBe(true);
      });

      it('should not call .preventDefault() on events when allowEventDefaults is set to true', function() {
        var renderer = createSvgRenderer();
        renderer.allowEventDefaults = true;

        var event = {
          target: createFakeDomNode(),
          preventDefault: jasmine.createSpy('preventDefault')
        };
        renderer.handleEvent(event);
        expect(event.preventDefault).not.toHaveBeenCalled();
      });

      it('should call .preventDefault() on events when allowEventDefaults is set to false', function() {
        var renderer = createSvgRenderer();
        renderer.allowEventDefaults = false;

        var event = {
          target: createFakeDomNode(),
          preventDefault: jasmine.createSpy('preventDefault')
        };
        renderer.handleEvent(event);
        expect(event.preventDefault).toHaveBeenCalled();
      });

      it('should call .preventDefault() on events when allowEventDefaults is not set', function() {
        var renderer = createSvgRenderer();

        var event = {
          target: createFakeDomNode(),
          preventDefault: jasmine.createSpy('preventDefault')
        };
        renderer.handleEvent(event);
        expect(event.preventDefault).toHaveBeenCalled();
      });
    });

    describe('#render', function() {
      it('should emit a "canRender" event after rendering', function() {
        var onCanRender = jasmine.createSpy('onCanRender');
        var renderer = createSvgRenderer();
        renderer.on('canRender', onCanRender);

        renderer.render([]);

        expect(onCanRender).toHaveBeenCalled();
      });
    });

    describe('applyFilter', function() {
      it('is a function', function() {
        expect(typeof createSvgRenderer().applyFilters).toBe('function');
      });
      it('adds a `_filterSignature` attribute to the node', function() {
        var node = createFakeDomNode();
        createSvgRenderer().applyFilters(node, []);
        expect(node._filterSignature).toBe('filter:');
      });
      it('adds a filter:colorMatrix() signature when a `colorMatrix` filter is applied', function() {
        var node = createFakeDomNode(), filter = { type: 'colorMatrix', value: [] };
        createSvgRenderer().applyFilters(node, [filter]);
        expect(node._filterSignature).toBe('filter:colorMatrix()');
      });
    });

    describe('drawAudio', function() {
      it('is a function', function() {
        expect(typeof createSvgRenderer().drawAudio).toBe('function');
      });
      describe('handles a Video Object depending on `message.attributes`', function() {
        it('attributes.playing=true', function() {
          var audioElement = { play: jasmine.createSpy('play') };
          var message = { attributes: { playing: true } };
          createSvgRenderer().drawAudio(audioElement, message);
          expect(audioElement.play).toHaveBeenCalled();
        });
        it('attributes.playing=false', function() {
          var audioElement = { pause: jasmine.createSpy('pause') };
          var message = { attributes: { playing: false } };
          createSvgRenderer().drawAudio(audioElement, message);
          expect(audioElement.pause).toHaveBeenCalled();
        });
        it('volume is not changed w/o attributes.volume', function() {
          var audioElement = { volume: 0.123 };
          var message = { attributes: {} };
          createSvgRenderer().drawAudio(audioElement, message);
          expect(audioElement.volume).toBe(0.123);
        });
        it('attributes.volume=0', function() {
          var audioElement = { volume: -1 };
          var message = { attributes: { volume: 0 } };
          createSvgRenderer().drawAudio(audioElement, message);
          expect(audioElement.volume).toBe(0);
        });
        it('attributes.volume=0.5', function() {
          var audioElement = { volume: -1 };
          var message = { attributes: { volume: 0.5 } };
          createSvgRenderer().drawAudio(audioElement, message);
          expect(audioElement.volume).toBe(0.5);
        });
        it('attributes.volume=1', function() {
          var audioElement = { volume: -1 };
          var message = { attributes: { volume: 1.0 } };
          createSvgRenderer().drawAudio(audioElement, message);
          expect(audioElement.volume).toBe(1.0);
        });
        it('attributes.volume=NaN (casted to `0`)', function() {
          var audioElement = { volume: -1 };
          var message = { attributes: { volume: NaN } };
          createSvgRenderer().drawAudio(audioElement, message);
          expect(audioElement.volume).toBe(0.0);
        });
      });
    });

    describe('Frame logging', function() {
      function createSvgRenderer(fpsLog, getTime) {
        var renderer = new SvgRenderer(createFakeDomNode(), 1, 1, {fpsLog: fpsLog});
        renderer.getTime = getTime;
        return renderer;
      }

      function createClock(fps) {
        var lastTime = 0, interval = 1000 / fps;
        return function() {
          return Math.round(lastTime += interval);
        }
      }

      it('should not collect frame times at all when fps logging is disabled', function() {
        /*
          Motivation for this test:

          The renderer truncated the frames array when logging out fps. But
          without an fps log, the array was filled and never truncated.

          This test makes sure we don't leak memory and get slow.
         */


        var frameRate = 60, seconds = 3;
        var renderer = createSvgRenderer(false, createClock(frameRate));

        for (var i = frameRate * seconds; i > 0; i -= 1) {
          renderer.render([]);
        }

        var frameTimes = renderer._frameTimes || [];
        expect(frameTimes).toEqual([]);
      });
    });
  });
});
