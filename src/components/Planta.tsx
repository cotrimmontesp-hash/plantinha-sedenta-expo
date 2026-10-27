// Plantinha em SVG (mesmo desenho do PWA). Estágios 0..5 e versão murcha.
import { memo } from 'react';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

interface Props { estagio: number; murcha: boolean; largura: number }

const ALTURAS = [250, 215, 180, 150, 100, 95];

function Planta({ estagio: s, murcha, largura }: Props) {
  const m = murcha && s > 0;
  const folha = m ? '#9a9a4a' : null;
  const petala = m ? '#c98aa5' : null;
  const topo = ALTURAS[s];
  const vis = (min: number, ate?: number) => (s >= min && (ate === undefined || s <= ate) ? 1 : 0);
  // murcha: rotate(-14deg) scaleY(.88) em torno de (150, 300)
  const t = m ? 'translate(150 300) rotate(-14) scale(1 0.88) translate(-150 -300)' : undefined;
  return (
    <Svg width={largura} height={(largura * 320) / 300} viewBox="0 0 300 320" accessibilityLabel={'Plantinha no estágio ' + s + ' de 5' + (m ? ', murcha de sede' : '')}>
      {/* vaso */}
      <Path d="M95 255 L205 255 L192 315 L108 315 Z" fill="#c8693b" stroke="#7a3a1c" strokeWidth={4} />
      <Rect x={88} y={244} width={124} height={18} rx={6} fill="#d97a48" stroke="#7a3a1c" strokeWidth={4} />
      <Ellipse cx={150} cy={250} rx={54} ry={6} fill="#5b3a22" />
      <G transform={t}>
        <Ellipse cx={150} cy={246} rx={10} ry={6} fill="#a8763e" opacity={s === 0 ? 1 : 0} />
        {s > 0 && <Path d={'M150 248 Q140 ' + (248 + topo) / 2 + ' 150 ' + topo} stroke={m ? '#8f8f45' : '#3fae4a'} strokeWidth={8} fill="none" strokeLinecap="round" />}
        <G opacity={vis(1)}>
          <Ellipse cx={135} cy={222} rx={16} ry={8} fill={folha ?? '#5ee06b'} transform="rotate(-30 135 222)" />
          <Ellipse cx={165} cy={222} rx={16} ry={8} fill={folha ?? '#5ee06b'} transform="rotate(30 165 222)" />
        </G>
        <Ellipse opacity={vis(2)} cx={128} cy={190} rx={24} ry={11} fill={folha ?? '#4cd35a'} transform="rotate(-25 128 190)" />
        <Ellipse opacity={vis(3)} cx={174} cy={165} rx={26} ry={12} fill={folha ?? '#4cd35a'} transform="rotate(25 174 165)" />
        <G opacity={vis(4)}>
          <Ellipse cx={126} cy={135} rx={26} ry={12} fill={folha ?? '#45c653'} transform="rotate(-25 126 135)" />
          <Ellipse cx={172} cy={118} rx={22} ry={10} fill={folha ?? '#45c653'} transform="rotate(25 172 118)" />
        </G>
        <Circle opacity={vis(4, 4)} cx={150} cy={92} r={10} fill="#ff9ec7" />
        <G opacity={vis(5)}>
          <Circle cx={150} cy={66} r={18} fill={petala ?? '#ff6fae'} /><Circle cx={150} cy={118} r={18} fill={petala ?? '#ff6fae'} />
          <Circle cx={124} cy={92} r={18} fill={petala ?? '#ff6fae'} /><Circle cx={176} cy={92} r={18} fill={petala ?? '#ff6fae'} />
          <Circle cx={132} cy={74} r={16} fill={petala ?? '#ff8cc0'} /><Circle cx={168} cy={74} r={16} fill={petala ?? '#ff8cc0'} />
          <Circle cx={132} cy={110} r={16} fill={petala ?? '#ff8cc0'} /><Circle cx={168} cy={110} r={16} fill={petala ?? '#ff8cc0'} />
          <Circle cx={150} cy={92} r={14} fill="#ffd23f" />
        </G>
      </G>
    </Svg>
  );
}
export default memo(Planta);
