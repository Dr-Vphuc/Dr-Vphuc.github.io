# -*- coding: utf-8 -*-
"""Cắt font chữ ký xuống còn đúng mấy chữ cái đang dùng.

Font gốc "MTD Verona Lotte.otf" nặng 672 KB và KHÔNG nằm trong repo — nó là
font của người khác, đẩy nguyên bản lên GitHub Pages là phát tán cả bộ cho
bất kỳ ai. Bản cắt chỉ còn 5 chữ V p h u c, khoảng 6 KB, không dùng lại được
vào việc gì khác.

Đổi tên trong chữ ký thì phải sửa CHU_KY dưới đây rồi chạy lại file này,
không thì mấy chữ mới sẽ rơi về font dự phòng.

    python tools/lam-font-chu-ky.py

Cần: pip install fonttools brotli
"""
import os

FONT_GOC = r'F:\autos\MTD Verona Lotte.otf'   # để ngoài repo, cố ý
CHU_KY   = u'Vphuc'
DICH_RA  = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                        '..', 'fonts', 'verona-lotte-sig.woff2')


def main():
    from fontTools.ttLib import TTFont
    from fontTools.subset import Subsetter, Options

    f = TTFont(FONT_GOC)
    o = Options()
    o.flavor = 'woff2'
    o.desubroutinize = True
    o.drop_tables += ['DSIG']
    s = Subsetter(options=o)
    s.populate(text=CHU_KY)
    s.subset(f)
    f.flavor = 'woff2'
    f.save(DICH_RA)
    print('%s -> %d bytes' % (os.path.normpath(DICH_RA), os.path.getsize(DICH_RA)))


if __name__ == '__main__':
    main()
