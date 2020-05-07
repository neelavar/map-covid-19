import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import { ScatterplotLayer } from '@deck.gl/layers';

const formatNumber = (num) => {
  return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
};

export const showStats = ({ object, x, y }) => {
  const el = document.getElementById('tooltip');
  if (object) {
    const {
      cases,
      deaths,
      total_recovered,
      serious_critical,
      active_cases,
      new_cases,
      country_name,
      flag,
      new_deaths,
      dpm,
      tpm,
      tcmp,
    } = object;

    const nC = new_cases ? `<tr><td>⚡ New Cases</td><td>${formatNumber(new_cases)}</td></tr>` : '';
    const nD = new_deaths ? `<tr><td>⚡ New Deaths</td><td>${formatNumber(new_deaths)}</td></tr>` : '';

    const dN = deaths ? `<td>⚰️ Deaths</td><td>${formatNumber(deaths)}</td>` : '<td></td>';
    const sC = serious_critical ? `<td>🚑 Serious</td><td>${formatNumber(serious_critical)}</td>` : '<td></td>';
    const aC = active_cases ? `<td>🛌 Active</td><td>${formatNumber(active_cases)}</td>` : '<td></td>';
    const tR = total_recovered ? `<td>🚶 Recovered</td><td>${formatNumber(total_recovered)}</td>` : '<td></td>';

    const dPM = dpm ? `<td>⚱️ Deaths/Mn</td><td>${dpm}</td>` : '<td></td>';
    const tPM = tpm ? `<td>🧪 Tests/Mn</td><td>${formatNumber(tpm)}</td>` : '<td></td>';
    const tcMP = tcmp ? `<td>🦠 Cases/Mn</td><td>${formatNumber(tcmp)}</td>` : '<td></td>';
    // el.innerHTML = `
    //     <h3><span style="font-size: 200%">${flag}</span><span>&nbsp; ${country_name.toUpperCase()}</span></h3>
    //     <table>${nC}</table>
    //     <table> ${dN}  ${sC} ${aC} ${tR} </table>
    //     <table>
    //       <tr><td>🦠 Cases</td><td>${formatNumber(cases)}</td></tr>
    //     </table>
    //     <table>
    //       <tr><td>📈 Mortality</td><td>${(deaths * 100/cases).toFixed(2)} %</td></tr>
    //       <tr><td>🚶 Recovery Rate</td><td>${(total_recovered * 100/cases).toFixed(2)} %</td></tr>
    //     </table>
    //   `;
    el.innerHTML = `
        <h3><span style="font-size: 200%">${flag}</span><span>&nbsp; ${country_name.toUpperCase()}</span></h3>
        <table>${nC} ${nD}</table>
        <table>
          <tr> ${dN} ${dPM} </tr>
          <tr> ${aC} ${tcMP} </tr>
          <tr> ${tR} ${tPM} </tr>
        </table>
        <table>
          <tr><td>📈 Mortality</td><td>${((deaths * 100) / cases).toFixed(2)} %</td></tr>
          <tr><td>🚶 Recovery Rate</td><td>${((total_recovered * 100) / cases).toFixed(2)} %</td></tr>
        </table>
      `;
    el.style.display = 'block';
    el.style.opacity = 0.7;
    el.style.left = x + 'px';
    el.style.top = y + 'px';
  } else {
    el.style.opacity = 0.0;
  }
};

export const scatterplot = (source_data) => {
  return new ScatterplotLayer({
    id: 'scatter',
    data: source_data,
    opacity: 0.7,
    filled: true,
    radiusMinPixels: 5,
    radiusMaxPixels: 100,
    radiusScale: 8,
    getPosition: (d) => [d.longitude, d.latitude],
    getFillColor: (d) => (d.deaths < 1 ? [255, 255, 0, 100] : [255, 0, 0, 100]),
    getRadius: (d) => (d.active_cases < 100 ? 5 : d.active_cases + d.deaths * 2),
    getLineWidth: 4,
    getLineColor: '#000000',
    pickable: true,
    onHover: showStats,
    onClick: showStats,
  });
};

export const heatmap = (source_data) => {
  return new HeatmapLayer({
    id: 'heat',
    data: source_data || [],
    getPosition: (d) => [d.longitude, d.latitude],
    getWeight: (d) => d.active_cases + d.new_cases * 2,
    radiusPixels: 120,
  });
};
