import { CSSProperties } from 'react';
import { ElementStyle, SectionStyle } from '../types';

export const createBackgroundStyle = (style: SectionStyle): CSSProperties => {
  if (style.background.type === 'image' && style.background.image) {
    return {
      backgroundImage: `url('${style.background.image}')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundColor: style.background.color,
    };
  }

  return { backgroundColor: style.background.color };
};

export const createHeroBackgroundStyle = (
  style: SectionStyle,
  fallbackImage: string | null,
): CSSProperties => {
  const base = createBackgroundStyle(style);

  if (style.background.type === 'image') {
    const image = style.background.image ?? fallbackImage;
    if (image) {
      return {
        ...base,
        backgroundImage: `url('${image}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      };
    }
    return base;
  }

  if (fallbackImage) {
    return {
      ...base,
      backgroundImage: `url('${fallbackImage}')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    };
  }

  return base;
};

export const createTextStyle = (style: SectionStyle): CSSProperties => ({
  color: style.textColor,
  fontFamily: style.fontFamily,
});

export const createBodyTextStyle = (style: SectionStyle): CSSProperties => ({
  ...createTextStyle(style),
  fontSize: style.fontSize,
});

export const createElementTextStyle = (
  sectionStyle: SectionStyle,
  elementStyle?: ElementStyle | null,
): CSSProperties => {
  const style: CSSProperties = {
    color: elementStyle?.textColor ?? sectionStyle.textColor,
    fontFamily: elementStyle?.fontFamily ?? sectionStyle.fontFamily,
  };

  if (elementStyle?.backgroundColor && elementStyle.backgroundColor.trim().length > 0) {
    style.backgroundColor = elementStyle.backgroundColor;
  }

  return style;
};

export const createElementBodyTextStyle = (
  sectionStyle: SectionStyle,
  elementStyle?: ElementStyle | null,
): CSSProperties => ({
  ...createElementTextStyle(sectionStyle, elementStyle),
  fontSize: elementStyle?.fontSize ?? sectionStyle.fontSize,
});

export const createElementBackgroundStyle = (
  _sectionStyle: SectionStyle,
  elementStyle?: ElementStyle | null,
): CSSProperties => {
  if (elementStyle?.backgroundColor) {
    return { backgroundColor: elementStyle.backgroundColor };
  }
  return {};
};
