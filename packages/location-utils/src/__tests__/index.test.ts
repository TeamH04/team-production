import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { getAreaForCoordinates, STATION_AREAS, AREA_OPTIONS } from '../index';

describe('getAreaForCoordinates', () => {
  describe('座標から最寄りエリアを取得', () => {
    test('三ノ宮駅付近の座標で「三宮・元町」を返す', () => {
      // 三ノ宮駅(JR)の座標付近
      const result = getAreaForCoordinates(34.694839, 135.194942);
      assert.equal(result, '三宮・元町');
    });

    test('神戸駅付近の座標で「神戸・新開地」を返す', () => {
      // 神戸駅の座標付近
      const result = getAreaForCoordinates(34.679528, 135.178025);
      assert.equal(result, '神戸・新開地');
    });

    test('須磨駅付近の座標で「須磨」を返す', () => {
      // 須磨駅の座標付近
      const result = getAreaForCoordinates(34.642272, 135.112892);
      assert.equal(result, '須磨');
    });

    test('板宿駅付近の座標で「須磨」を返す', () => {
      // 板宿駅の座標付近
      const result = getAreaForCoordinates(34.660058, 135.133403);
      assert.equal(result, '須磨');
    });

    test('西神中央駅付近の座標で「西神(西区)」を返す', () => {
      // 西神中央駅の座標付近
      const result = getAreaForCoordinates(34.719469, 135.017447);
      assert.equal(result, '西神(西区)');
    });

    test('有馬温泉駅付近の座標で「北区(田舎)」を返す', () => {
      // 有馬温泉駅の座標付近
      const result = getAreaForCoordinates(34.799322, 135.245969);
      assert.equal(result, '北区(田舎)');
    });
  });

  describe('null/undefined の場合', () => {
    test('latitude が null の場合は undefined を返す', () => {
      const result = getAreaForCoordinates(null, 135.194942);
      assert.equal(result, undefined);
    });

    test('longitude が null の場合は undefined を返す', () => {
      const result = getAreaForCoordinates(34.694839, null);
      assert.equal(result, undefined);
    });

    test('両方 null の場合は undefined を返す', () => {
      const result = getAreaForCoordinates(null, null);
      assert.equal(result, undefined);
    });

    test('latitude が undefined の場合は undefined を返す', () => {
      const result = getAreaForCoordinates(undefined, 135.194942);
      assert.equal(result, undefined);
    });

    test('longitude が undefined の場合は undefined を返す', () => {
      const result = getAreaForCoordinates(34.694839, undefined);
      assert.equal(result, undefined);
    });

    test('両方 undefined の場合は undefined を返す', () => {
      const result = getAreaForCoordinates(undefined, undefined);
      assert.equal(result, undefined);
    });

    test('引数なしの場合は undefined を返す', () => {
      const result = getAreaForCoordinates();
      assert.equal(result, undefined);
    });
  });
});

describe('STATION_AREAS', () => {
  describe('配列の基本検証', () => {
    test('配列が空でないこと', () => {
      assert.ok(STATION_AREAS.length > 0);
    });

    test('配列に複数の駅が含まれていること', () => {
      assert.ok(STATION_AREAS.length > 50);
    });
  });

  describe('各駅に必須プロパティがあること', () => {
    test('全ての駅に name プロパティがあること', () => {
      for (const station of STATION_AREAS) {
        assert.ok(typeof station.name === 'string');
        assert.ok(station.name.length > 0);
      }
    });

    test('全ての駅に kana プロパティがあること', () => {
      for (const station of STATION_AREAS) {
        assert.ok(typeof station.kana === 'string');
        assert.ok(station.kana.length > 0);
      }
    });

    test('全ての駅に area プロパティがあること', () => {
      for (const station of STATION_AREAS) {
        assert.ok(typeof station.area === 'string');
        assert.ok(station.area.length > 0);
      }
    });

    test('全ての駅に latitude プロパティがあること', () => {
      for (const station of STATION_AREAS) {
        assert.ok(typeof station.latitude === 'number');
        assert.ok(!Number.isNaN(station.latitude));
      }
    });

    test('全ての駅に longitude プロパティがあること', () => {
      for (const station of STATION_AREAS) {
        assert.ok(typeof station.longitude === 'number');
        assert.ok(!Number.isNaN(station.longitude));
      }
    });
  });

  describe('座標の妥当性', () => {
    test('全ての駅の緯度が日本の範囲内であること', () => {
      for (const station of STATION_AREAS) {
        // 日本の緯度は約20度〜46度
        assert.ok(station.latitude >= 20 && station.latitude <= 46);
      }
    });

    test('全ての駅の経度が日本の範囲内であること', () => {
      for (const station of STATION_AREAS) {
        // 日本の経度は約122度〜154度
        assert.ok(station.longitude >= 122 && station.longitude <= 154);
      }
    });
  });

  describe('特定の駅の存在確認', () => {
    test('三ノ宮駅(JR)が含まれていること', () => {
      const sannomiya = STATION_AREAS.find(s => s.name === '三ノ宮駅(ＪＲ)');
      assert.ok(sannomiya !== undefined);
      assert.equal(sannomiya.area, '三宮・元町');
    });

    test('神戸駅が含まれていること', () => {
      const kobe = STATION_AREAS.find(s => s.name === '神戸駅');
      assert.ok(kobe !== undefined);
      assert.equal(kobe.area, '神戸・新開地');
    });

    test('須磨駅が含まれていること', () => {
      const suma = STATION_AREAS.find(s => s.name === '須磨駅');
      assert.ok(suma !== undefined);
      assert.equal(suma.area, '須磨');
    });
  });
});

describe('AREA_OPTIONS', () => {
  describe('基本検証', () => {
    test('配列が空でないこと', () => {
      assert.ok(AREA_OPTIONS.length > 0);
    });

    test('配列が文字列の配列であること', () => {
      for (const area of AREA_OPTIONS) {
        assert.ok(typeof area === 'string');
      }
    });
  });

  describe('重複がないこと', () => {
    test('エリアオプションに重複がないこと', () => {
      const uniqueAreas = new Set(AREA_OPTIONS);
      assert.equal(uniqueAreas.size, AREA_OPTIONS.length);
    });
  });

  describe('想定されるエリアが含まれること', () => {
    test('「三宮・元町」が含まれていること', () => {
      assert.ok(AREA_OPTIONS.includes('三宮・元町'));
    });

    test('「神戸・新開地」が含まれていること', () => {
      assert.ok(AREA_OPTIONS.includes('神戸・新開地'));
    });

    test('「須磨」が含まれていること', () => {
      assert.ok(AREA_OPTIONS.includes('須磨'));
    });

    test('「北区(田舎)」が含まれていること', () => {
      assert.ok(AREA_OPTIONS.includes('北区(田舎)'));
    });

    test('「西神(西区)」が含まれていること', () => {
      assert.ok(AREA_OPTIONS.includes('西神(西区)'));
    });
  });

  describe('STATION_AREAS との整合性', () => {
    test('STATION_AREAS の全エリアが AREA_OPTIONS に含まれていること', () => {
      const areasInStations = Array.from(new Set(STATION_AREAS.map(s => s.area)));
      for (const area of areasInStations) {
        assert.ok(
          AREA_OPTIONS.includes(area),
          `エリア "${area}" が AREA_OPTIONS に含まれていません`,
        );
      }
    });

    test('AREA_OPTIONS の全エリアが STATION_AREAS で使用されていること', () => {
      const areasInStations = new Set(STATION_AREAS.map(s => s.area));
      for (const area of AREA_OPTIONS) {
        assert.ok(
          areasInStations.has(area),
          `エリア "${area}" が STATION_AREAS で使用されていません`,
        );
      }
    });
  });
});
