// axios import 제거
// API_BASE_URL 변수 제거

// 임시 데이터
const mockOrganizations = [
  {
    id: 1,
    name: "한국성폭력상담소",
    description: "성폭력 피해자에 대한 상담, 법률지원, 의료지원, 심리치료 등 종합적인 지원 서비스를 제공하는 비영리 민간단체입니다. 24시간 긴급상담과 함께 피해자의 권리회복을 위한 법률지원, 의료지원, 심리상담, 보호시설 연계 등 다양한 서비스를 제공합니다.",
    homepage: "https://www.sisters.or.kr",
    phone: "02-338-2060",
    services: ["24시간 긴급상담", "법률지원", "의료지원", "심리상담", "보호시설 연계"],
    operatingHours: "24시간",
    location: "서울시 마포구"
  },
  {
    id: 2,
    name: "한국여성의전화",
    description: "여성폭력 피해자를 위한 24시간 긴급상담과 함께 법률상담, 의료지원, 심리상담, 보호시설 연계 등 종합적인 지원 서비스를 제공합니다. 전국 지부를 통해 지역별 맞춤형 지원을 제공합니다.",
    homepage: "http://www.women21.or.kr",
    phone: "02-2263-6465",
    services: ["24시간 긴급상담", "법률상담", "의료지원", "심리상담", "보호시설 연계"],
    operatingHours: "24시간",
    location: "서울시 중구"
  },
  {
    id: 3,
    name: "한국여성인권진흥원",
    description: "여성인권 보호와 성평등 실현을 위한 연구, 교육, 상담, 지원 사업을 수행하는 공공기관입니다. 성폭력 피해자 지원, 여성인권 교육, 정책 연구 등을 통해 여성인권 증진에 기여합니다.",
    homepage: "http://www.kwhrp.or.kr",
    phone: "02-3156-5400",
    services: ["상담", "교육", "연구", "정책개발"],
    operatingHours: "평일 09:00-18:00",
    location: "서울시 종로구"
  },
  {
    id: 4,
    name: "한국여성변호사회",
    description: "성폭력 피해자를 위한 전문 법률 지원을 제공하는 여성 변호사 단체입니다. 무료 법률 상담, 소송 지원, 법률 교육 등을 통해 피해자의 권리 회복을 지원합니다.",
    homepage: "https://www.kwla.or.kr",
    phone: "02-735-8994",
    services: ["법률상담", "소송지원", "법률교육"],
    operatingHours: "평일 09:00-18:00",
    location: "서울시 종로구"
  },
  {
    id: 5,
    name: "한국여성민우회",
    description: "여성인권 보호와 성평등 실현을 위한 여성운동 단체입니다. 성폭력 피해자 지원, 여성인권 교육, 정책 모니터링 등을 통해 여성의 권리 증진을 위해 활동합니다.",
    homepage: "http://www.womenlink.or.kr",
    phone: "02-313-0903",
    services: ["상담", "교육", "정책활동", "네트워크"],
    operatingHours: "평일 09:00-18:00",
    location: "서울시 마포구"
  },
  {
    id: 6,
    name: "한국성폭력상담소 부산지부",
    description: "부산 지역 성폭력 피해자를 위한 종합 지원 서비스를 제공합니다. 24시간 긴급상담과 함께 법률, 의료, 심리 상담 및 보호시설 연계 서비스를 제공합니다.",
    services: ["24시간 긴급상담", "법률상담", "의료지원", "심리상담", "보호시설 연계"],
    operatingHours: "24시간",
    location: "부산시 해운대구",
    contact: "051-747-6465",
    homepage: "https://www.sisters.or.kr/busan"
  },
  {
    id: 7,
    name: "한국성폭력상담소 대구지부",
    description: "대구 지역 성폭력 피해자를 위한 종합 지원 서비스를 제공합니다. 24시간 긴급상담과 함께 법률, 의료, 심리 상담 및 보호시설 연계 서비스를 제공합니다.",
    services: ["24시간 긴급상담", "법률상담", "의료지원", "심리상담", "보호시설 연계"],
    operatingHours: "24시간",
    location: "대구시 중구",
    contact: "053-423-5800",
    homepage: "https://www.sisters.or.kr/daegu"
  },
  {
    id: 8,
    name: "한국성폭력상담소 광주지부",
    description: "광주 지역 성폭력 피해자를 위한 종합 지원 서비스를 제공합니다. 24시간 긴급상담과 함께 법률, 의료, 심리 상담 및 보호시설 연계 서비스를 제공합니다.",
    services: ["24시간 긴급상담", "법률상담", "의료지원", "심리상담", "보호시설 연계"],
    operatingHours: "24시간",
    location: "광주시 서구",
    contact: "062-365-5800",
    homepage: "https://www.sisters.or.kr/gwangju"
  },
  {
    id: 9,
    name: "한국여성의전화 부산지부",
    description: "부산 지역 여성폭력 피해자를 위한 24시간 긴급 상담 서비스를 제공합니다. 법률, 의료, 심리 상담 및 보호시설 연계 서비스를 제공합니다.",
    services: ["24시간 긴급상담", "법률상담", "의료지원", "심리상담", "보호시설 연계"],
    operatingHours: "24시간",
    location: "부산시 해운대구",
    contact: "051-747-6465",
    homepage: "https://www.hotline.or.kr/busan"
  },
  {
    id: 10,
    name: "한국여성의전화 대전지부",
    description: "대전 지역 여성폭력 피해자를 위한 24시간 긴급 상담 서비스를 제공합니다. 법률, 의료, 심리 상담 및 보호시설 연계 서비스를 제공합니다.",
    services: ["24시간 긴급상담", "법률상담", "의료지원", "심리상담", "보호시설 연계"],
    operatingHours: "24시간",
    location: "대전시 중구",
    contact: "042-226-6465",
    homepage: "https://www.hotline.or.kr/daejeon"
  },
  {
    id: 11,
    name: "한국성폭력상담소 인천지부",
    description: "인천 지역 성폭력 피해자를 위한 종합 지원 서비스를 제공합니다. 24시간 긴급상담과 함께 법률, 의료, 심리 상담 및 보호시설 연계 서비스를 제공합니다.",
    services: ["24시간 긴급상담", "법률상담", "의료지원", "심리상담", "보호시설 연계"],
    operatingHours: "24시간",
    location: "인천시 남동구",
    contact: "032-422-5800",
    homepage: "https://www.sisters.or.kr/incheon"
  },
  {
    id: 12,
    name: "한국성폭력상담소 울산지부",
    description: "울산 지역 성폭력 피해자를 위한 종합 지원 서비스를 제공합니다. 24시간 긴급상담과 함께 법률, 의료, 심리 상담 및 보호시설 연계 서비스를 제공합니다.",
    services: ["24시간 긴급상담", "법률상담", "의료지원", "심리상담", "보호시설 연계"],
    operatingHours: "24시간",
    location: "울산시 남구",
    contact: "052-226-5800",
    homepage: "https://www.sisters.or.kr/ulsan"
  },
  {
    id: 13,
    name: "한국성폭력상담소 경기지부",
    description: "경기 지역 성폭력 피해자를 위한 종합 지원 서비스를 제공합니다. 24시간 긴급상담과 함께 법률, 의료, 심리 상담 및 보호시설 연계 서비스를 제공합니다.",
    services: ["24시간 긴급상담", "법률상담", "의료지원", "심리상담", "보호시설 연계"],
    operatingHours: "24시간",
    location: "수원시",
    contact: "031-226-5800",
    homepage: "https://www.sisters.or.kr/gyeonggi"
  },
  {
    id: 14,
    name: "한국여성의전화 인천지부",
    description: "인천 지역 여성폭력 피해자를 위한 24시간 긴급 상담 서비스를 제공합니다. 법률, 의료, 심리 상담 및 보호시설 연계 서비스를 제공합니다.",
    services: ["24시간 긴급상담", "법률상담", "의료지원", "심리상담", "보호시설 연계"],
    operatingHours: "24시간",
    location: "인천시 남동구",
    contact: "032-422-6465",
    homepage: "https://www.hotline.or.kr/incheon"
  },
  {
    id: 15,
    name: "한국여성의전화 울산지부",
    description: "울산 지역 여성폭력 피해자를 위한 24시간 긴급 상담 서비스를 제공합니다. 법률, 의료, 심리 상담 및 보호시설 연계 서비스를 제공합니다.",
    services: ["24시간 긴급상담", "법률상담", "의료지원", "심리상담", "보호시설 연계"],
    operatingHours: "24시간",
    location: "울산시 남구",
    contact: "052-226-6465",
    homepage: "https://www.hotline.or.kr/ulsan"
  },
  {
    id: 16,
    name: "한국여성의전화 경기지부",
    description: "경기 지역 여성폭력 피해자를 위한 24시간 긴급 상담 서비스를 제공합니다. 법률, 의료, 심리 상담 및 보호시설 연계 서비스를 제공합니다.",
    services: ["24시간 긴급상담", "법률상담", "의료지원", "심리상담", "보호시설 연계"],
    operatingHours: "24시간",
    location: "수원시",
    contact: "031-226-6465",
    homepage: "https://www.hotline.or.kr/gyeonggi"
  },
  {
    id: 17,
    name: "한국성폭력상담소 강원지부",
    description: "강원 지역 성폭력 피해자를 위한 종합 지원 서비스를 제공합니다. 24시간 긴급상담과 함께 법률, 의료, 심리 상담 및 보호시설 연계 서비스를 제공합니다.",
    services: ["24시간 긴급상담", "법률상담", "의료지원", "심리상담", "보호시설 연계"],
    operatingHours: "24시간",
    location: "춘천시",
    contact: "033-226-5800",
    homepage: "https://www.sisters.or.kr/gangwon"
  },
  {
    id: 18,
    name: "한국성폭력상담소 충북지부",
    description: "충북 지역 성폭력 피해자를 위한 종합 지원 서비스를 제공합니다. 24시간 긴급상담과 함께 법률, 의료, 심리 상담 및 보호시설 연계 서비스를 제공합니다.",
    services: ["24시간 긴급상담", "법률상담", "의료지원", "심리상담", "보호시설 연계"],
    operatingHours: "24시간",
    location: "청주시",
    contact: "043-226-5800",
    homepage: "https://www.sisters.or.kr/chungbuk"
  },
  {
    id: 19,
    name: "한국성폭력상담소 충남지부",
    description: "충남 지역 성폭력 피해자를 위한 종합 지원 서비스를 제공합니다. 24시간 긴급상담과 함께 법률, 의료, 심리 상담 및 보호시설 연계 서비스를 제공합니다.",
    services: ["24시간 긴급상담", "법률상담", "의료지원", "심리상담", "보호시설 연계"],
    operatingHours: "24시간",
    location: "천안시",
    contact: "041-226-5800",
    homepage: "https://www.sisters.or.kr/chungnam"
  },
  {
    id: 20,
    name: "한국성폭력상담소 전북지부",
    description: "전북 지역 성폭력 피해자를 위한 종합 지원 서비스를 제공합니다. 24시간 긴급상담과 함께 법률, 의료, 심리 상담 및 보호시설 연계 서비스를 제공합니다.",
    services: ["24시간 긴급상담", "법률상담", "의료지원", "심리상담", "보호시설 연계"],
    operatingHours: "24시간",
    location: "전주시",
    contact: "063-226-5800",
    homepage: "https://www.sisters.or.kr/jeonbuk"
  },
  {
    id: 21,
    name: "한국성폭력상담소 전남지부",
    description: "전남 지역 성폭력 피해자를 위한 종합 지원 서비스를 제공합니다. 24시간 긴급상담과 함께 법률, 의료, 심리 상담 및 보호시설 연계 서비스를 제공합니다.",
    services: ["24시간 긴급상담", "법률상담", "의료지원", "심리상담", "보호시설 연계"],
    operatingHours: "24시간",
    location: "광주시",
    contact: "062-226-5800",
    homepage: "https://www.sisters.or.kr/jeonnam"
  },
  {
    id: 22,
    name: "한국성폭력상담소 경북지부",
    description: "경북 지역 성폭력 피해자를 위한 종합 지원 서비스를 제공합니다. 24시간 긴급상담과 함께 법률, 의료, 심리 상담 및 보호시설 연계 서비스를 제공합니다.",
    services: ["24시간 긴급상담", "법률상담", "의료지원", "심리상담", "보호시설 연계"],
    operatingHours: "24시간",
    location: "대구시",
    contact: "053-226-5800",
    homepage: "https://www.sisters.or.kr/gyeongbuk"
  },
  {
    id: 23,
    name: "한국성폭력상담소 경남지부",
    description: "경남 지역 성폭력 피해자를 위한 종합 지원 서비스를 제공합니다. 24시간 긴급상담과 함께 법률, 의료, 심리 상담 및 보호시설 연계 서비스를 제공합니다.",
    services: ["24시간 긴급상담", "법률상담", "의료지원", "심리상담", "보호시설 연계"],
    operatingHours: "24시간",
    location: "부산시",
    contact: "051-226-5800",
    homepage: "https://www.sisters.or.kr/gyeongnam"
  },
  {
    id: 24,
    name: "한국성폭력상담소 제주지부",
    description: "제주 지역 성폭력 피해자를 위한 종합 지원 서비스를 제공합니다. 24시간 긴급상담과 함께 법률, 의료, 심리 상담 및 보호시설 연계 서비스를 제공합니다.",
    services: ["24시간 긴급상담", "법률상담", "의료지원", "심리상담", "보호시설 연계"],
    operatingHours: "24시간",
    location: "제주시",
    contact: "064-226-5800",
    homepage: "https://www.sisters.or.kr/jeju"
  },
  {
    id: 25,
    name: "한국여성변호사회",
    description: "성폭력 피해자를 위한 전문 여성 변호사들의 법률 지원 서비스를 제공합니다. 무료 법률 상담과 소송 지원을 제공하며, 피해자의 권리 회복을 위한 전문적인 법률 서비스를 제공합니다.",
    services: ["법률상담", "소송지원", "변호사선임", "법률교육"],
    operatingHours: "평일 09:00-18:00",
    location: "서울시 종로구",
    contact: "02-735-8994",
    homepage: "https://www.kwla.or.kr"
  },
  {
    id: 26,
    name: "한국여성민우회",
    description: "성폭력 피해자 지원과 여성 인권 보호를 위한 종합적인 서비스를 제공합니다. 상담, 법률 지원, 교육 프로그램 등을 운영하며, 성평등 사회를 위한 다양한 활동을 전개합니다.",
    services: ["상담지원", "법률지원", "교육프로그램", "정책제안"],
    operatingHours: "평일 09:00-18:00",
    location: "서울시 마포구",
    contact: "02-737-5763",
    homepage: "https://www.womenlink.or.kr"
  },
  {
    id: 27,
    name: "한국여성재단",
    description: "성폭력 피해자를 위한 경제적 지원과 자립 프로그램을 제공합니다. 피해자의 경제적 자립을 돕기 위한 다양한 지원 사업을 운영합니다.",
    services: ["경제지원", "자립프로그램", "취업지원", "멘토링"],
    operatingHours: "평일 09:00-18:00",
    location: "서울시 서초구",
    contact: "02-3486-7100",
    homepage: "https://www.kwfund.or.kr"
  },
  {
    id: 28,
    name: "한국여성상담센터",
    description: "성폭력 피해자를 위한 전문적인 심리 상담 서비스를 제공합니다. 트라우마 치료와 심리 회복을 위한 다양한 프로그램을 운영합니다.",
    services: ["심리상담", "트라우마치료", "그룹상담", "가족상담"],
    operatingHours: "평일 09:00-18:00",
    location: "서울시 강남구",
    contact: "02-538-1338",
    homepage: "https://www.women1366.or.kr"
  },
  {
    id: 29,
    name: "한국여성의전화 부산지부",
    description: "부산 지역 여성폭력 피해자를 위한 24시간 긴급 상담 서비스를 제공합니다. 법률, 의료, 심리 상담 및 보호시설 연계 서비스를 제공합니다.",
    services: ["24시간 긴급상담", "법률상담", "의료지원", "심리상담", "보호시설 연계"],
    operatingHours: "24시간",
    location: "부산시 해운대구",
    contact: "051-747-6465",
    homepage: "https://www.hotline.or.kr/busan"
  },
  {
    id: 30,
    name: "한국여성의전화 대구지부",
    description: "대구 지역 여성폭력 피해자를 위한 24시간 긴급 상담 서비스를 제공합니다. 법률, 의료, 심리 상담 및 보호시설 연계 서비스를 제공합니다.",
    services: ["24시간 긴급상담", "법률상담", "의료지원", "심리상담", "보호시설 연계"],
    operatingHours: "24시간",
    location: "대구시 중구",
    contact: "053-423-6465",
    homepage: "https://www.hotline.or.kr/daegu"
  },
  {
    id: 31,
    name: "한국여성의전화 광주지부",
    description: "광주 지역 여성폭력 피해자를 위한 24시간 긴급 상담 서비스를 제공합니다. 법률, 의료, 심리 상담 및 보호시설 연계 서비스를 제공합니다.",
    services: ["24시간 긴급상담", "법률상담", "의료지원", "심리상담", "보호시설 연계"],
    operatingHours: "24시간",
    location: "광주시 서구",
    contact: "062-365-6465",
    homepage: "https://www.hotline.or.kr/gwangju"
  },
  {
    id: 32,
    name: "한국여성의전화 대전지부",
    description: "대전 지역 여성폭력 피해자를 위한 24시간 긴급 상담 서비스를 제공합니다. 법률, 의료, 심리 상담 및 보호시설 연계 서비스를 제공합니다.",
    services: ["24시간 긴급상담", "법률상담", "의료지원", "심리상담", "보호시설 연계"],
    operatingHours: "24시간",
    location: "대전시 중구",
    contact: "042-226-6465",
    homepage: "https://www.hotline.or.kr/daejeon"
  },
  {
    id: 33,
    name: "한국여성의전화 세종지부",
    description: "세종 지역 여성폭력 피해자를 위한 24시간 긴급 상담 서비스를 제공합니다. 법률, 의료, 심리 상담 및 보호시설 연계 서비스를 제공합니다.",
    services: ["24시간 긴급상담", "법률상담", "의료지원", "심리상담", "보호시설 연계"],
    operatingHours: "24시간",
    location: "세종시",
    contact: "044-226-6465",
    homepage: "https://www.hotline.or.kr/sejong"
  },
  {
    id: 34,
    name: "한국여성의전화 강원지부",
    description: "강원 지역 여성폭력 피해자를 위한 24시간 긴급 상담 서비스를 제공합니다. 법률, 의료, 심리 상담 및 보호시설 연계 서비스를 제공합니다.",
    services: ["24시간 긴급상담", "법률상담", "의료지원", "심리상담", "보호시설 연계"],
    operatingHours: "24시간",
    location: "춘천시",
    contact: "033-226-6465",
    homepage: "https://www.hotline.or.kr/gangwon"
  },
  {
    id: 35,
    name: "한국여성의전화 충북지부",
    description: "충북 지역 여성폭력 피해자를 위한 24시간 긴급 상담 서비스를 제공합니다. 법률, 의료, 심리 상담 및 보호시설 연계 서비스를 제공합니다.",
    services: ["24시간 긴급상담", "법률상담", "의료지원", "심리상담", "보호시설 연계"],
    operatingHours: "24시간",
    location: "청주시",
    contact: "043-226-6465",
    homepage: "https://www.hotline.or.kr/chungbuk"
  },
  {
    id: 36,
    name: "한국여성의전화 충남지부",
    description: "충남 지역 여성폭력 피해자를 위한 24시간 긴급 상담 서비스를 제공합니다. 법률, 의료, 심리 상담 및 보호시설 연계 서비스를 제공합니다.",
    services: ["24시간 긴급상담", "법률상담", "의료지원", "심리상담", "보호시설 연계"],
    operatingHours: "24시간",
    location: "천안시",
    contact: "041-226-6465",
    homepage: "https://www.hotline.or.kr/chungnam"
  },
  {
    id: 37,
    name: "한국여성의전화 전북지부",
    description: "전북 지역 여성폭력 피해자를 위한 24시간 긴급 상담 서비스를 제공합니다. 법률, 의료, 심리 상담 및 보호시설 연계 서비스를 제공합니다.",
    services: ["24시간 긴급상담", "법률상담", "의료지원", "심리상담", "보호시설 연계"],
    operatingHours: "24시간",
    location: "전주시",
    contact: "063-226-6465",
    homepage: "https://www.hotline.or.kr/jeonbuk"
  },
  {
    id: 38,
    name: "한국여성의전화 전남지부",
    description: "전남 지역 여성폭력 피해자를 위한 24시간 긴급 상담 서비스를 제공합니다. 법률, 의료, 심리 상담 및 보호시설 연계 서비스를 제공합니다.",
    services: ["24시간 긴급상담", "법률상담", "의료지원", "심리상담", "보호시설 연계"],
    operatingHours: "24시간",
    location: "광주시",
    contact: "062-226-6465",
    homepage: "https://www.hotline.or.kr/jeonnam"
  },
  {
    id: 39,
    name: "한국여성의전화 경북지부",
    description: "경북 지역 여성폭력 피해자를 위한 24시간 긴급 상담 서비스를 제공합니다. 법률, 의료, 심리 상담 및 보호시설 연계 서비스를 제공합니다.",
    services: ["24시간 긴급상담", "법률상담", "의료지원", "심리상담", "보호시설 연계"],
    operatingHours: "24시간",
    location: "대구시",
    contact: "053-226-6465",
    homepage: "https://www.hotline.or.kr/gyeongbuk"
  },
  {
    id: 40,
    name: "한국여성의전화 경남지부",
    description: "경남 지역 여성폭력 피해자를 위한 24시간 긴급 상담 서비스를 제공합니다. 법률, 의료, 심리 상담 및 보호시설 연계 서비스를 제공합니다.",
    services: ["24시간 긴급상담", "법률상담", "의료지원", "심리상담", "보호시설 연계"],
    operatingHours: "24시간",
    location: "부산시",
    contact: "051-226-6465",
    homepage: "https://www.hotline.or.kr/gyeongnam"
  },
  {
    id: 41,
    name: "한국여성의전화 제주지부",
    description: "제주 지역 여성폭력 피해자를 위한 24시간 긴급 상담 서비스를 제공합니다. 법률, 의료, 심리 상담 및 보호시설 연계 서비스를 제공합니다.",
    services: ["24시간 긴급상담", "법률상담", "의료지원", "심리상담", "보호시설 연계"],
    operatingHours: "24시간",
    location: "제주시",
    contact: "064-226-6465",
    homepage: "https://www.hotline.or.kr/jeju"
  }
];

// 기관 데이터 타입 정의
/**
 * @typedef {Object} Organization
 * @property {number} id - 기관 고유 ID
 * @property {string} name - 기관명
 * @property {string} description - 기관 설명
 * @property {string} location - 주소
 * @property {string} phone - 전화번호
 * @property {string} email - 이메일
 * @property {string[]} services - 제공 서비스 목록
 * @property {Object} operatingHours - 운영 시간
 * @property {string} operatingHours.weekday - 평일 운영시간
 * @property {string} operatingHours.weekend - 주말 운영시간
 * @property {string} operatingHours.holiday - 공휴일 운영시간
 * @property {number} latitude - 위도
 * @property {number} longitude - 경도
 * @property {string} website - 웹사이트 URL
 */

/**
 * 기관 목록 조회
 * @param {Object} filters - 검색 필터
 * @param {string} [filters.search] - 검색어
 * @param {string[]} [filters.services] - 서비스 필터
 * @param {string} [filters.operatingHours] - 운영시간 필터
 * @returns {Promise<Organization[]>}
 */
export const getOrganizations = async (filters = {}) => {
  // 목업 데이터 반환
  return mockOrganizations;
};

/**
 * 기관 상세 정보 조회
 * @param {number} id - 기관 ID
 * @returns {Promise<Organization>}
 */
export const getOrganizationDetail = async (id) => {
  // 목업 데이터에서 해당 ID의 기관 정보 반환
  return mockOrganizations.find((org) => org.id === id);
};

/**
 * 기관 리뷰 작성
 * @param {number} organizationId - 기관 ID
 * @param {Object} review - 리뷰 데이터
 * @param {string} review.content - 리뷰 내용
 * @returns {Promise<Object>}
 */
export const createReview = async (organizationId, reviewData) => {
  // 목업 데이터로 리뷰 생성
  return {
    id: Date.now(),
    content: reviewData.content,
    createdAt: new Date().toISOString(),
  };
};

/**
 * 기관 리뷰 목록 조회
 * @param {number} organizationId - 기관 ID
 * @returns {Promise<Object[]>}
 */
export const getReviews = async (organizationId) => {
  // 목업 데이터로 리뷰 목록 반환
  return [];
};

// 기관 검색
export const searchOrganizations = async (query) => {
  // 검색어를 소문자로 변환하고 공백 제거
  const normalizedQuery = query.toLowerCase().trim();

  // 검색어가 비어있으면 전체 목록 반환
  if (!normalizedQuery) return mockOrganizations;

  // 검색어를 공백으로 분리하여 키워드 배열 생성
  const keywords = normalizedQuery.split(/\s+/);

  // 목업 데이터에서 검색어로 필터링
  return mockOrganizations.filter((org) => {
    // 검색 대상 필드들
    const searchableFields = [
      org.name,
      org.description,
      org.location,
      ...org.services,
    ];

    // 모든 키워드가 하나 이상의 필드에 포함되어 있는지 확인
    return keywords.every((keyword) =>
      searchableFields.some((field) => field.toLowerCase().includes(keyword))
    );
  });
};

// 기관 필터링
export const filterOrganizations = async (filters) => {
  let filteredOrgs = [...mockOrganizations];

  // 검색어 필터링
  if (filters.search) {
    const searchResults = await searchOrganizations(filters.search);
    filteredOrgs = filteredOrgs.filter((org) =>
      searchResults.some((result) => result.id === org.id)
    );
  }

  // 운영시간 필터링
  if (filters.operatingHours) {
    filteredOrgs = filteredOrgs.filter(
      (org) => org.operatingHours === filters.operatingHours
    );
  }

  // 서비스 필터링
  if (filters.services && filters.services.length > 0) {
    filteredOrgs = filteredOrgs.filter((org) =>
      filters.services.every((service) => org.services.includes(service))
    );
  }

  return filteredOrgs;
};
