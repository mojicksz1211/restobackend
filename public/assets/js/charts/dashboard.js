let winlossChart;

(function (jQuery) {
  "use strict";
  if (document.querySelectorAll('#myChart').length) {
    const chartElem = document.getElementById('myChart');
    const totalRollingVal = parseFloat(chartElem.dataset.totalrolling);
    const houseRollingVal = parseFloat(chartElem.dataset.houserolling);
  
    const options = {
      series: [{
        name: 'Amount',
        data: [totalRollingVal, houseRollingVal]
      }],
      chart: {
        type: 'bar',
        height: 300,
        toolbar: {
          show: true,
          tools: {
            download: true
          }
        },
        animations: {
          enabled: true // We handle animation via CSS for slide-in effect
        }
      },
      plotOptions: {
        bar: {
          horizontal: true,
          distributed: true,
          borderRadius: 1,
          barHeight: '70%',
          dataLabels: {
            position: 'center'
          }
        }
      },
      xaxis: {
        categories: ['Total Rolling', 'House Rolling'],
        labels: {
          show: true,
          style: {
            fontSize: '11px',
            colors: ['#6c757d']
          }
        }
      },
      yaxis: {
        labels: { show: false }
      },
      dataLabels: {
        enabled: true,
        formatter: function (val, opts) {
          const label = opts.w.config.xaxis.categories[opts.dataPointIndex];
          return [
            label,
            '₱' + Number(val).toLocaleString()
          ];
        },
        style: {
          colors: ['#ffffff'],
          fontSize: '13px',
          fontWeight: '600'
        },
        textAnchor: 'middle',
        offsetY: -15
      },
      tooltip: {
        enabled: true,
        y: {
          formatter: function (val) {
            return '₱' + Number(val).toLocaleString();
          }
        }
      },
      legend: { show: false },
      colors: [
        'var(--bs-primary)',        // Total Rolling
        'var(--bs-secondary)'       // House Rolling
      ]
    };
  
    if (typeof ApexCharts !== 'undefined') {
      const chart = new ApexCharts(chartElem, options);
      chart.render();
    }
  }
  
  
if (document.querySelectorAll('#d-activity').length) {
  const options = {
    series: [{
      name: 'Net',
      data: []
    }],
    chart: {
      type: 'bar',
      height: 230,
      toolbar: { show: false }
    },
    plotOptions: {
      bar: {
        distributed: true,
        horizontal: false,
        columnWidth: '40%',
        endingShape: 'rounded',
        borderRadius: 4
      }
    },
    fill: {
      opacity: 1,
      colors: []
    },
    dataLabels: {
      enabled: false
    },
    legend: {
      show: false
    },
    stroke: {
      show: true,
      width: 2,
      colors: ['transparent']
    },
    xaxis: {
      categories: [],
      labels: {
        style: { colors: getComputedStyle(document.documentElement).getPropertyValue('--bs-secondary-color').trim() }
      }
    },
    yaxis: {
      labels: {
        style: { colors: getComputedStyle(document.documentElement).getPropertyValue('--bs-secondary-color').trim() }
      }
    },
    tooltip: {
      y: {
        formatter: function (_, { dataPointIndex }) {
          const realVal = winlossChart.realNetData?.[dataPointIndex] || 0;
          const label = realVal >= 0 ? 'Win' : 'Loss';
          return `${label}: ₱ ${Math.abs(realVal).toLocaleString()}`;
        }
      }
    }
  };

  winlossChart = new ApexCharts(document.querySelector("#d-activity"), options);
  winlossChart.render();

  // ✅ Add this function here
  function updateWinlossChart(chartData) {
    if (!winlossChart) return;
  
    try {
      // Check if chartData and data exist
      if (!chartData || !chartData.data || !Array.isArray(chartData.data)) {
        // Silent return for template - no console logs
        return;
      }
    
      // Gawin mong numeric
      const realData = chartData.data.map(v => parseFloat(v) || 0);
    
      // Itabi sa chart object para sa tooltip
      winlossChart.realNetData = realData;
    
      // Height ng bar ay absolute value
      const displayData = realData.map(v => Math.abs(v));
    
      // Get Bootstrap CSS variables
      const style = getComputedStyle(document.documentElement);
      const primaryColor = style.getPropertyValue('--bs-primary').trim();
      const dangerColor = style.getPropertyValue('--bs-danger').trim();
      
      // Use Bootstrap colors for the bars
      const barColors = realData.map(v => v < 0 ? dangerColor : primaryColor);
    
      // Calculate trend (positive or negative)
      const totalWinloss = realData.reduce((sum, val) => sum + val, 0);
      const trend = totalWinloss >= 0 ? 'positive' : 'negative';
      
      // Update the chart with enhanced options
      winlossChart.updateOptions({
        series: [{
          name: 'Net',
          data: displayData
        }],
        xaxis: {
          categories: chartData.labels
        },
        fill: {
          colors: barColors
        },
       
        tooltip: {
          y: {
            formatter: function (_, { dataPointIndex }) {
              const realVal = realData[dataPointIndex] || 0;
              const label = realVal >= 0 ? 'Win' : 'Loss';
              return `${label}: ₱ ${Math.abs(realVal).toLocaleString()}`;
            }
          },
          x: {
            formatter: function(val) {
              return val;
            }
          },
          custom: function({ series, seriesIndex, dataPointIndex, w }) {
            const realVal = realData[dataPointIndex] || 0;
            const label = realVal >= 0 ? 'Win' : 'Loss';
            const color = realVal >= 0 ? primaryColor : dangerColor;
            
            return `
              <div class="custom-tooltip" style="padding: 8px; background: #fff; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">
                <div style="font-weight: bold; margin-bottom: 4px;">${w.globals.labels[dataPointIndex]}</div>
                <div style="color: ${color}; font-weight: bold;">
                  ${label}: ₱ ${Math.abs(realVal).toLocaleString()}
                </div>
              </div>
            `;
          }
        }
      });
      
      // Update the trend indicator in the UI if it exists
      const trendIndicator = document.getElementById('winloss-trend');
      if (trendIndicator) {
        trendIndicator.className = `trend-indicator ${trend}`;
        trendIndicator.innerHTML = trend === 'positive' ? 
          '<i class="fas fa-arrow-up"></i> Positive' : 
          '<i class="fas fa-arrow-down"></i> Negative';
      }
    } catch (error) {
      // Silent error handling for template - no console logs
      // Chart will just not update if there's an error
      return;
    }
  }
  
  

  // ⬇️ Optional: expose globally if needed elsewhere
  window.updateWinlossChart = updateWinlossChart;
}

if (document.querySelector('#admin-sales-trend')) {
  const adminSalesOptions = {
    series: [
      { name: 'Mainbranch', data: [620000, 870000, 1050000, 1280000, 1500000, 1710000, 1980000, 2140000] },
      { name: 'Makati Branch', data: [410000, 650000, 870000, 932000, 1050000, 1170000, 1290000, 1410000] },
      { name: 'BGC Branch', data: [520000, 710000, 940000, 1130000, 1310000, 1460000, 1680000, 1820000] }
    ],
    chart: {
      type: 'area',
      height: 280,
      toolbar: { show: false },
      stacked: false,
      sparkline: { enabled: false }
    },
    colors: ['#0d6efd', '#0dcaf0', '#f97316'],
    dataLabels: { enabled: false },
    stroke: {
      curve: 'smooth',
      width: 2
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.65,
        opacityTo: 0.12,
        stops: [0, 60, 100]
      }
    },
    markers: { size: 0 },
    xaxis: {
      categories: ['7AM', '9AM', '11AM', '1PM', '3PM', '5PM', '7PM', '9PM'],
      labels: {
        style: {
          colors: '#6c757d'
        }
      }
    },
    yaxis: {
      labels: {
        formatter: function (val) {
          return '₱ ' + Number(val).toLocaleString('en-US', { minimumFractionDigits: 0 });
        }
      }
    },
    tooltip: {
      y: {
        formatter: function (val) {
          return '₱ ' + Number(val).toLocaleString('en-US', { minimumFractionDigits: 0 });
        }
      }
    },
    legend: {
      position: 'top',
      horizontalAlign: 'right'
    }
  };

  const adminSalesChart = new ApexCharts(document.querySelector('#admin-sales-trend'), adminSalesOptions);
  adminSalesChart.render();
}

if (document.querySelector('#admin-cost-analysis')) {
  const adminCostOptions = {
    series: [
      { name: 'Mainbranch', data: [2.48, 1.32, 0.95] },
      { name: 'Makati Branch', data: [1.85, 1.05, 1.05] },
      { name: 'BGC Branch', data: [1.92, 0.98, 0.82] }
    ],
    chart: {
      type: 'bar',
      height: 280,
      stacked: false,
      toolbar: { show: false }
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        columnWidth: '45%',
        distributed: false
      }
    },
    colors: ['#0d6efd', '#0dcaf0', '#f97316'],
    dataLabels: { enabled: false },
    stroke: {
      show: true,
      width: 2,
      colors: ['transparent']
    },
    xaxis: {
      categories: ['Personnel', 'Material', 'Operating'],
      labels: {
        style: {
          colors: '#6c757d'
        }
      }
    },
    yaxis: {
      labels: {
        formatter: function (val) {
          return '₱ ' + Number(val).toLocaleString('en-US', { minimumFractionDigits: 2 }) + 'M';
        }
      },
      title: {
        text: '₱ Millions',
        style: {
          fontSize: '12px',
          color: '#6c757d'
        }
      }
    },
    tooltip: {
      y: {
        formatter: function (val) {
          return '₱ ' + Number(val).toLocaleString('en-US', { minimumFractionDigits: 2 }) + ' Million';
        }
      }
    },
    legend: { show: false }
  };

  const adminCostChart = new ApexCharts(document.querySelector('#admin-cost-analysis'), adminCostOptions);
  adminCostChart.render();
}

if (document.querySelectorAll('#d-main').length) {
  const options = {
      series: [{
          name: 'total',
          data: [94, 80, 94, 80, 94, 80, 94]
      }, {
          name: 'pipline',
          data: [72, 60, 84, 60, 74, 60, 78]
      }],
      chart: {
          fontFamily: '"Inter", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
          height: 245,
          type: 'area',
          toolbar: {
              show: false
          },
          sparkline: {
              enabled: false,
          },
      },
      colors: ["#3a57e8", "#4bc7d2"],
      dataLabels: {
          enabled: false
      },
      stroke: {
          curve: 'smooth',
          width: 3,
      },
      yaxis: {
        show: true,
        labels: {
          show: true,
          minWidth: 19,
          maxWidth: 19,
          style: {
            colors: "#8A92A6",
          },
          offsetX: -5,
        },
      },
      legend: {
          show: false,
      },
      xaxis: {
          labels: {
              minHeight:22,
              maxHeight:22,
              show: true,
              style: {
                colors: "#8A92A6",
              },
          },
          lines: {
              show: false  //or just here to disable only x axis grids
          },
          categories: ["Jan", "Feb", "Mar", "Apr", "Jun", "Jul", "Aug"]
      },
      grid: {
          show: false,
      },
      fill: {
          type: 'gradient',
          gradient: {
              shade: 'dark',
              type: "vertical",
              shadeIntensity: 0,
              gradientToColors: undefined, // optional, if not defined - uses the shades of same color in series
              inverseColors: true,
              opacityFrom: .4,
              opacityTo: .1,
              stops: [0, 50, 80],
              colors: ["#3a57e8", "#4bc7d2"]
          }
      },
      tooltip: {
        enabled: true,
      },
  };

  const chart = new ApexCharts(document.querySelector("#d-main"), options);
  chart.render();
  document.addEventListener('ColorChange', (e) => {
    console.log(e)
    const newOpt = {
      colors: [e.detail.detail1, e.detail.detail2],
      fill: {
        type: 'gradient',
        gradient: {
            shade: 'dark',
            type: "vertical",
            shadeIntensity: 0,
            gradientToColors: [e.detail.detail1, e.detail.detail2], // optional, if not defined - uses the shades of same color in series
            inverseColors: true,
            opacityFrom: .4,
            opacityTo: .1,
            stops: [0, 50, 60],
            colors: [e.detail.detail1, e.detail.detail2],
        }
    },
   }
    chart.updateOptions(newOpt)
  })
}
if ($('.d-slider1').length > 0) {
    const options = {
        centeredSlides: false,
        loop: false,
        slidesPerView: 4,
        autoplay:false,
        spaceBetween: 32,
        breakpoints: {
            320: { slidesPerView: 1 },
            550: { slidesPerView: 2 },
            991: { slidesPerView: 3 },
            1400: { slidesPerView: 3 },
            1500: { slidesPerView: 4 },
            1920: { slidesPerView: 6 },
            2040: { slidesPerView: 7 },
            2440: { slidesPerView: 8 }
        },
        pagination: {
            el: '.swiper-pagination'
        },
        navigation: {
            nextEl: '.my-custom-next',
            prevEl: '.my-custom-prev'
        },  

        // And if we need scrollbar
        scrollbar: {
            el: '.swiper-scrollbar'  
        }
    } 
    let swiper = new Swiper('.d-slider1',options);

    document.addEventListener('ChangeMode', (e) => {
      if (e.detail.rtl === 'rtl' || e.detail.rtl === 'ltr') {
        swiper.destroy(true, true)
        setTimeout(() => {
            swiper = new Swiper('.d-slider1',options);
        }, 500);
      }
    })
}

})(jQuery)
